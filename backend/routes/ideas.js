/**
 * 아이디어 CRUD + 다시보기 메모(본문 append) + 소프트 삭제(씨앗 키워드).
 * DB 스키마 차이(구버전 컬럼 없음)는 ER_BAD_FIELD_ERROR 시 fallback 쿼리로 흡수합니다.
 * API 엔드포인트.
 */
import express from "express";
import db from "../db.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();
const WORD_SPLIT_REGEX = /[^0-9A-Za-z가-힣]+/;
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434/api/generate";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.1:8b";

const tokenize = (text = "") =>
  String(text)
    .toLowerCase()
    .split(WORD_SPLIT_REGEX)
    .filter((token) => token.length > 1);

const termFrequency = (tokens) => {
  const map = new Map();
  tokens.forEach((token) => {
    map.set(token, (map.get(token) || 0) + 1);
  });
  return map;
};

const cosineSimilarity = (aText, bText) => {
  const aTokens = tokenize(aText);
  const bTokens = tokenize(bText);
  if (aTokens.length === 0 || bTokens.length === 0) return 0;

  const aTf = termFrequency(aTokens);
  const bTf = termFrequency(bTokens);
  const vocabulary = new Set([...aTf.keys(), ...bTf.keys()]);

  let dot = 0;
  let aNorm = 0;
  let bNorm = 0;

  vocabulary.forEach((term) => {
    const aVal = aTf.get(term) || 0;
    const bVal = bTf.get(term) || 0;
    dot += aVal * bVal;
    aNorm += aVal * aVal;
    bNorm += bVal * bVal;
  });

  if (aNorm === 0 || bNorm === 0) return 0;
  return dot / (Math.sqrt(aNorm) * Math.sqrt(bNorm));
};

const pickKeyTerms = (content = "", max = 3) => {
  const tf = termFrequency(tokenize(content));
  return [...tf.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([term]) => term);
};

const parsePromptArray = (raw = "") =>
  String(raw)
    .split("\n")
    .map((line) => line.replace(/^\s*(\d+[\).]|[-*])\s*/, "").trim())
    .filter((line) => line.length > 0)
    .slice(0, 3);

const buildFallbackPrompts = (idea) => {
  const keyTerms = pickKeyTerms(idea.content, 2);
  const focus = keyTerms.length > 0 ? keyTerms.join(", ") : "핵심 아이디어";

  return [
    `이 아이디어의 핵심 가정 1가지를 반대로 뒤집으면 어떤 새로운 기회가 보일까요? (${focus})`,
    "이 아이디어를 실제로 검증하려면 이번 주에 실행할 수 있는 가장 작은 실험은 무엇인가요?",
    "실패 가능성이 가장 큰 지점을 한 가지 고르고, 그 위험을 줄이기 위한 대안을 적어보세요."
  ];
};

const generatePromptsWithOllama = async (idea) => {
  const prompt = `너는 아이디어 코치다.
아래 아이디어를 바탕으로 한국어 회고 질문 3개만 작성해라.
조건:
- 질문만 출력
- 번호 형식(1., 2., 3.)
- 중복 없이 서로 다른 관점

제목: ${idea.title || "(제목 없음)"}
내용: ${idea.content}`;

  const response = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false
    })
  });

  if (!response.ok) {
    throw new Error(`OLLAMA_HTTP_${response.status}`);
  }

  const data = await response.json();
  return parsePromptArray(data.response || "");
};

/** GET /ideas — 활성 아이디어만 (status 컬럼 없으면 fallback 쿼리) */
router.get("/", authMiddleware, (req, res) => {
  const userId = req.userId;

  db.query(
    "SELECT id, title, content FROM ideas WHERE user_id = ? AND status = 'active' ORDER BY id DESC",
    [userId],
    (err, result) => {
      // status 컬럼이 없는 스키마
      if (err && err.code === "ER_BAD_FIELD_ERROR") {
        db.query(
          "SELECT id, title, content FROM ideas WHERE user_id = ? ORDER BY id DESC",
          [userId],
          (fallbackErr, fallbackResult) => {
            // title 컬럼까지 없는 매우 옛 스키마
            if (fallbackErr && fallbackErr.code === "ER_BAD_FIELD_ERROR") {
              db.query(
                "SELECT id, content FROM ideas WHERE user_id = ? ORDER BY id DESC",
                [userId],
                (legacyErr, legacyResult) => {
                  if (legacyErr) return res.status(500).json(legacyErr);
                  const normalized = legacyResult.map((row) => ({
                    ...row,
                    title: null
                  }));
                  return res.json(normalized);
                }
              );
              return;
            }
            if (fallbackErr) return res.status(500).json(fallbackErr);
            return res.json(fallbackResult);
          }
        );
        return;
      }
      if (err) return res.status(500).json(err);
      res.json(result);
    }
  );
});

/** GET /ideas/seeds — 소프트 삭제 + legacy_keyword, create_at/created_at 오름차순 */
router.get("/seeds", authMiddleware, (req, res) => {
  const userId = req.userId;

  const delBothTs =
    "SELECT id, title, content, legacy_keyword, create_at, created_at FROM ideas WHERE user_id = ? AND status = 'deleted' ORDER BY COALESCE(create_at, created_at) ASC, id ASC";
  const delCreate =
    "SELECT id, title, content, legacy_keyword, create_at FROM ideas WHERE user_id = ? AND status = 'deleted' ORDER BY create_at ASC, id ASC";
  const delCreated =
    "SELECT id, title, content, legacy_keyword, created_at FROM ideas WHERE user_id = ? AND status = 'deleted' ORDER BY created_at ASC, id ASC";
  const delNoTs =
    "SELECT id, title, content, legacy_keyword FROM ideas WHERE user_id = ? AND status = 'deleted' ORDER BY id ASC";

  const legBothTs =
    "SELECT id, title, content, legacy_keyword, create_at, created_at FROM ideas WHERE user_id = ? AND legacy_keyword IS NOT NULL ORDER BY COALESCE(create_at, created_at) ASC, id ASC";
  const legCreate =
    "SELECT id, title, content, legacy_keyword, create_at FROM ideas WHERE user_id = ? AND legacy_keyword IS NOT NULL ORDER BY create_at ASC, id ASC";
  const legCreated =
    "SELECT id, title, content, legacy_keyword, created_at FROM ideas WHERE user_id = ? AND legacy_keyword IS NOT NULL ORDER BY created_at ASC, id ASC";
  const legNoTs =
    "SELECT id, title, content, legacy_keyword FROM ideas WHERE user_id = ? AND legacy_keyword IS NOT NULL ORDER BY id ASC";

  db.query(delBothTs, [userId], (err, result) => {
    if (!err) return res.json(result);
    if (err.code !== "ER_BAD_FIELD_ERROR") return res.status(500).json(err);

    db.query(delCreate, [userId], (e2, r2) => {
      if (!e2) return res.json(r2);
      if (e2.code !== "ER_BAD_FIELD_ERROR") return res.status(500).json(e2);

      db.query(delCreated, [userId], (e3, r3) => {
        if (!e3) return res.json(r3);
        if (e3.code !== "ER_BAD_FIELD_ERROR") return res.status(500).json(e3);

        db.query(delNoTs, [userId], (e4, r4) => {
          if (!e4) return res.json(r4);
          if (e4.code !== "ER_BAD_FIELD_ERROR") return res.status(500).json(e4);

          db.query(legBothTs, [userId], (e5, r5) => {
            if (!e5) return res.json(r5);
            if (e5.code !== "ER_BAD_FIELD_ERROR") return res.status(500).json(e5);

            db.query(legCreate, [userId], (e6, r6) => {
              if (!e6) return res.json(r6);
              if (e6.code !== "ER_BAD_FIELD_ERROR") return res.status(500).json(e6);

              db.query(legCreated, [userId], (e7, r7) => {
                if (!e7) return res.json(r7);
                if (e7.code !== "ER_BAD_FIELD_ERROR") return res.status(500).json(e7);

                db.query(legNoTs, [userId], (e8, r8) => {
                  if (e8 && e8.code === "ER_BAD_FIELD_ERROR") return res.json([]);
                  if (e8) return res.status(500).json(e8);
                  return res.json(r8);
                });
              });
            });
          });
        });
      });
    });
  });
});

/** POST /ideas — 신규 행 INSERT (title 컬럼 없으면 content만) */
router.post("/", authMiddleware, (req, res) => {
  const { title, content } = req.body;
  const userId = req.userId;

  db.query(
    "INSERT INTO ideas (user_id, title, content) VALUES (?, ?, ?)",
    [userId, title || null, content],
    (err, result) => {
      if (err && err.code === "ER_BAD_FIELD_ERROR") {
        db.query(
          "INSERT INTO ideas (user_id, content) VALUES (?, ?)",
          [userId, content],
          (fallbackErr) => {
            if (fallbackErr) return res.status(500).json(fallbackErr);
            return res.json({ message: "아이디어 저장 성공" });
          }
        );
        return;
      }
      if (err) return res.status(500).json(err);

      res.json({
        message: "아이디어 저장 성공"
      });
    }
  );
});

/**
 * GET /ideas/:id/similar
 * 현재 아이디어와 내 다른 아이디어들의 텍스트 유사도를 계산해 상위 n개 반환.
 */
router.get("/:id/similar", authMiddleware, (req, res) => {
  const userId = req.userId;
  const ideaId = Number(req.params.id);
  const limit = Math.min(Math.max(Number(req.query.limit) || 3, 1), 10);

  if (!Number.isFinite(ideaId) || ideaId <= 0) {
    return res.status(400).json({ message: "유효하지 않은 아이디어입니다." });
  }

  db.query(
    "SELECT id, title, content FROM ideas WHERE id = ? AND user_id = ?",
    [ideaId, userId],
    (targetErr, targetRows) => {
      if (targetErr) return res.status(500).json(targetErr);
      if (!targetRows || targetRows.length === 0) {
        return res.status(404).json({ message: "기준 아이디어를 찾을 수 없습니다." });
      }

      const targetIdea = targetRows[0];
      db.query(
        "SELECT id, title, content FROM ideas WHERE user_id = ? AND id <> ?",
        [userId, ideaId],
        (listErr, rows) => {
          if (listErr) return res.status(500).json(listErr);

          const ranked = (rows || [])
            .map((idea) => ({
              ...idea,
              score: cosineSimilarity(targetIdea.content || "", idea.content || "")
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

          return res.json({
            baseIdea: { id: targetIdea.id, title: targetIdea.title || "(제목 없음)" },
            similarIdeas: ranked
          });
        }
      );
    }
  );
});

/**
 * POST /ideas/:id/reflect-prompts
 * 회고 질문 3개를 생성해 반환. Ollama 사용 가능하면 우선 사용, 실패 시 로컬 fallback.
 */
router.post("/:id/reflect-prompts", authMiddleware, async (req, res) => {
  const userId = req.userId;
  const ideaId = Number(req.params.id);

  if (!Number.isFinite(ideaId) || ideaId <= 0) {
    return res.status(400).json({ message: "유효하지 않은 아이디어입니다." });
  }

  db.query(
    "SELECT id, title, content FROM ideas WHERE id = ? AND user_id = ?",
    [ideaId, userId],
    async (err, rows) => {
      if (err) return res.status(500).json(err);
      if (!rows || rows.length === 0) {
        return res.status(404).json({ message: "아이디어를 찾을 수 없습니다." });
      }

      const idea = rows[0];
      try {
        const prompts = await generatePromptsWithOllama(idea);
        if (prompts.length > 0) {
          return res.json({ source: "ollama", prompts });
        }
      } catch (_error) {
        // Ollama 미실행/오류 시에도 기능 사용성을 위해 로컬 질문 생성으로 fallback
      }

      const fallbackPrompts = buildFallbackPrompts(idea);
      return res.json({ source: "local-fallback", prompts: fallbackPrompts });
    }
  );
});

/**
 * PATCH /ideas/:id/restore
 * 소프트 삭제된 행을 다시 active로 — 씨앗 보관함에서 메인 목록으로 합침
 */
router.patch("/:id/restore", authMiddleware, (req, res) => {
  const userId = req.userId;
  const ideaId = Number(req.params.id);

  if (!Number.isFinite(ideaId) || ideaId <= 0) {
    return res.status(400).json({ message: "유효하지 않은 아이디어입니다." });
  }

  db.query(
    "UPDATE ideas SET status = 'active', legacy_keyword = NULL WHERE id = ? AND user_id = ? AND status = 'deleted'",
    [ideaId, userId],
    (err, result) => {
      if (err && err.code === "ER_BAD_FIELD_ERROR") {
        db.query(
          "UPDATE ideas SET legacy_keyword = NULL WHERE id = ? AND user_id = ? AND legacy_keyword IS NOT NULL",
          [ideaId, userId],
          (e2, r2) => {
            if (e2) return res.status(500).json(e2);
            if (r2.affectedRows === 0) {
              return res.status(404).json({
                message: "씨앗으로 보관 중인 아이디어가 없거나 이미 목록에 있습니다."
              });
            }
            return res.json({ message: "아이디어를 목록에 다시 합쳤습니다." });
          }
        );
        return;
      }
      if (err) return res.status(500).json(err);
      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "삭제된 아이디어가 없거나 이미 복구되었습니다."
        });
      }
      return res.json({ message: "아이디어를 목록에 다시 합쳤습니다." });
    }
  );
});

/**
 * PATCH /ideas/:id/reflect
 * 본문 끝에 메모 문자열을 CONCAT — 별도 reflection 테이블 없이 단순 구현
 */
router.patch("/:id/reflect", authMiddleware, (req, res) => {
  const userId = req.userId;
  const ideaId = Number(req.params.id);
  const reflection = (req.body?.reflection || "").trim();

  if (!reflection) {
    return res.status(400).json({ message: "메모를 입력해 주세요." });
  }

  const appendText = `\n\n${reflection}`; // 줄바꿈으로 이전 본문과 구분

  db.query(
    "UPDATE ideas SET content = CONCAT(content, ?) WHERE id = ? AND user_id = ?",
    [appendText, ideaId, userId],
    (err, result) => {
      if (err) return res.status(500).json(err);
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "아이디어를 찾을 수 없습니다." });
      }

      db.query(
        "SELECT id, title, content FROM ideas WHERE id = ? AND user_id = ?",
        [ideaId, userId],
        (selectErr, rows) => {
          if (selectErr) return res.status(500).json(selectErr);
          return res.json({
            message: "사유 저장 성공",
            idea: rows[0]
          });
        }
      );
    }
  );
});

/**
 * DELETE /ideas/:id
 * 기본: 소프트 삭제(status, legacy_keyword). 컬럼 없으면 물리 DELETE fallback.
 */
router.delete("/:id", authMiddleware, (req, res) => {
  const userId = req.userId;
  const ideaId = Number(req.params.id);
  const keyword = (req.body?.keyword || "").trim() || null;

  db.query(
    "UPDATE ideas SET legacy_keyword = ?, status = 'deleted' WHERE id = ? AND user_id = ?",
    [keyword, ideaId, userId],
    (err, result) => {
      if (err && err.code === "ER_BAD_FIELD_ERROR") {
        db.query(
          "DELETE FROM ideas WHERE id = ? AND user_id = ?",
          [ideaId, userId],
          (fallbackErr, fallbackResult) => {
            if (fallbackErr) return res.status(500).json(fallbackErr);
            if (fallbackResult.affectedRows === 0) {
              return res.status(404).json({ message: "아이디어를 찾을 수 없습니다." });
            }
            return res.json({ message: "아이디어 삭제 성공", keyword });
          }
        );
        return;
      }
      if (err) return res.status(500).json(err);
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "아이디어를 찾을 수 없습니다." });
      }

      return res.json({ message: "아이디어 삭제 성공", keyword });
    }
  );
});

export default router;
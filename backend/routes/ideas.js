/**
 * 아이디어 CRUD + 다시보기 메모(본문 append) + 소프트 삭제(씨앗 키워드).
 * DB 스키마 차이(구버전 컬럼 없음)는 ER_BAD_FIELD_ERROR 시 fallback 쿼리로 흡수합니다.
 */
import express from "express";
import db from "../db.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

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
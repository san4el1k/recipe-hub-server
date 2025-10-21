import express from "express";
import { PrismaClient } from "@prisma/client";
import {authMiddleware} from "../middlewares/authMiddleware.js";


const router = express.Router();
const prisma = new PrismaClient();

// Поставить лайк
router.post("/:id/like", authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const recipeId = parseInt(req.params.id);

    try {
        await prisma.like.create({
            data: { userId, recipeId }
        });

        const likes = await prisma.like.count({ where: { recipeId } });
        res.json({ success: true, likes });
    } catch (error) {
        if (error.code === "P2002") {
            return res.status(400).json({ message: "Вы уже лайкнули этот рецепт." });
        }
        res.status(500).json({ message: "Ошибка при лайке." });
    }
});

// Убрать лайк
router.delete("/:id/like", authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const recipeId = parseInt(req.params.id);

    try {
        await prisma.like.delete({
            where: {
                userId_recipeId: {
                    userId,
                    recipeId,
                },
            },
        });

        const likes = await prisma.like.count({ where: { recipeId } });
        res.json({ success: true, likes });
    } catch (error) {
        res.status(500).json({ message: "Ошибка при удалении лайка." });
    }
});

// Проверить лайк
router.get("/:id/liked", authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const recipeId = parseInt(req.params.id);

    const like = await prisma.like.findUnique({
        where: {
            userId_recipeId: { userId, recipeId },
        },
    });

    res.json({ liked: !!like });
});

// Получить количество лайков
router.get("/:id/likes", async (req, res) => {
    const recipeId = parseInt(req.params.id);
    const count = await prisma.like.count({ where: { recipeId } });
    res.json({ count });
});

export default router;

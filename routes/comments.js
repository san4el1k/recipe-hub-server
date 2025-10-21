import express from "express";
import prisma from '../prismaClient.js';
import {authMiddleware} from "../middlewares/authMiddleware.js";

const router = express.Router();

// 📌 Получить все комментарии по ID рецепта
router.get("/:recipeId/comments", async (req, res) => {
    const { recipeId } = req.params;

    try {
        const comments = await prisma.comment.findMany({
            where: {
                recipeId: Number(recipeId),
            },
            orderBy: {
                createdAt: "desc", // сортировка по дате (свежие первыми)
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        res.json(comments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Ошибка при получении комментариев" });
    }
});

// 📌 Получить один комментарий по ID
router.get("/:recipeId/comments/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const comment = await prisma.comment.findUnique({
            where: { id: Number(id) },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                recipe: {
                    select: {
                        id: true,
                        title: true, // если в модели Recipe есть поле title
                    },
                },
            },
        });

        if (!comment) {
            return res.status(404).json({ message: "Комментарий не найден" });
        }

        res.json(comment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Ошибка при получении комментария" });
    }
});

// 📌 Добавить комментарий (только для авторизованных)
router.post("/:recipeId/comments", authMiddleware, async (req, res) => {
    const { recipeId } = req.params;
    const { body, userId, name, email } = req.body;

    try {
        // Проверка на пустой текст комментария
        if (!body || body.trim() === "") {
            return res.status(400).json({ message: "Комментарий не может быть пустым" });
        }

        const newComment = await prisma.comment.create({
            data: {
                body,
                name,
                email,
                recipeId: Number(recipeId),
                userId,
            },
        });

        res.status(201).json(newComment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Ошибка при создании комментария" });
    }
});

// 📌 Изменение комментария (только автор или админ)
router.put("/:recipeId/comments/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { body } = req.body;

    try {
        const comment = await prisma.comment.findUnique({ where: { id: Number(id) } });

        if (!comment) {
            return res.status(404).json({ message: "Комментарий не найден" });
        }

        // Проверка прав
        if (comment.userId !== req.user.id && req.user.role !== "ADMIN") {
            return res.status(403).json({ message: "Нет доступа для изменения комментария" });
        }

        if (!body || body.trim() === "") {
            return res.status(400).json({ message: "Комментарий не может быть пустым" });
        }

        const updatedComment = await prisma.comment.update({
            where: { id: Number(id) },
            data: { body },
        });

        res.json(updatedComment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Ошибка при изменении комментария" });
    }
});


// 📌 Удаление комментария (только автор или админ)
router.delete("/:recipeId/comments/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        const comment = await prisma.comment.findUnique({ where: { id: Number(id) } });

        if (!comment) {
            return res.status(404).json({ message: "Комментарий не найден" });
        }

        // Проверка прав
        if (comment.userId !== req.user.id && req.user.role !== "ADMIN") {
            return res.status(403).json({ message: "Нет доступа для удаления комментария" });
        }

        await prisma.comment.delete({ where: { id: Number(id) } });

        res.json({ message: "Комментарий успешно удалён" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Ошибка при удалении комментария" });
    }
});


export default router;

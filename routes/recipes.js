import express from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();
const prisma = new PrismaClient();

// Получение всех рецептов
router.get("/", async (req, res) => {
    try {
        const recipes = await prisma.recipe.findMany({
            include: { author: { select: { name: true, email: true } } },
        });
        res.json(recipes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch recipes" });
    }
});

// Получение рецепта по ID
router.get("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id); // если id числовой
        if (isNaN(id)) {
            return res.status(400).json({ message: "Invalid ID" });
        }

        const recipe = await prisma.recipe.findUnique({
            where: { id },
            include: { author: { select: { name: true, email: true } } },
        });

        if (!recipe) {
            return res.status(404).json({ message: "Recipe not found" });
        }

        res.json(recipe);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch recipe" });
    }
});

// Создание рецепта (только авторизованные)
router.post("/", authMiddleware, async (req, res) => {
    try {
        const {
            title, description, ingredients, instructions,
            servings, prepTime, cookTime, image
        } = req.body;

        // Проверяем количество рецептов для обычного пользователя
        if (req.user.role === "USER") {
            const userRecipesCount = await prisma.recipe.count({
                where: { authorId: req.user.id }
            });

            if (userRecipesCount >= process.env.MAX_RECIPES_USER) {
                return res.status(403).json({ message: `USER can create only ${process.env.MAX_RECIPES_USER} recipes` });
            }
        }

        const recipe = await prisma.recipe.create({
            data: {
                title,
                description,
                ingredients,
                instructions,
                servings,
                prepTime,
                cookTime,
                totalTime: parseInt(prepTime) + parseInt(cookTime),
                image,
                authorId: req.user.id,
            },
        });

        res.json(recipe);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to create recipe" });
    }
});

// Удаление рецепта (только автор или админ)
router.delete("/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        const recipe = await prisma.recipe.findUnique({ where: { id: parseInt(id) } });

        if (!recipe) return res.status(404).json({ message: "Recipe not found" });

        if (
            req.user.role !== "ADMIN" &&
            Number(req.user.id) !== recipe.authorId
        ) {
            return res.status(403).json({ message: "Forbidden" });
        }


        await prisma.recipe.delete({ where: { id: parseInt(id) } });
        res.json({ message: "Recipe deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to delete recipe" });
    }
});

// Изменение рецепта (только автор или админ)
router.put("/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;
    const data = req.body;

    try {
        const recipe = await prisma.recipe.findUnique({
            where: { id: parseInt(id) }
        });

        if (!recipe) {
            return res.status(404).json({ message: "Recipe not found" });
        }

        // Проверяем права: либо админ, либо автор рецепта
        if (req.user.role !== "ADMIN" && req.user.id !== recipe.authorId) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const updated = await prisma.recipe.update({
            where: { id: parseInt(id) },
            data: {
                ...data,
                totalTime: data.prepTime && data.cookTime
                    ? parseInt(data.prepTime) + parseInt(data.cookTime)
                    : recipe.totalTime,
            },
        });

        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to update recipe" });
    }
});


export default router;

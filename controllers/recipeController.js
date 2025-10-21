// backend — controllers/recipeController.js
import req from "express/lib/request.js";
import res from "express/lib/response.js";

const recipe = await prisma.recipe.findUnique({
    where: { id: Number(req.params.id) },
    include: {
        _count: {
            select: { likes: true }
        }
    }
});

res.json(recipe);
import { CategoryModel } from '../models/CategoryModel.js';

export const categoryController = {
  async getAll(req, res) {
    try {
      const categories = await CategoryModel.getAll();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async createOrUpdate(req, res) {
    try {
      const catData = req.body;
      if (catData.int_Category_Id) {
        await CategoryModel.update(catData.int_Category_Id, catData);
      } else {
        await CategoryModel.create(catData);
      }
      const updatedList = await CategoryModel.getAll();
      res.json(updatedList);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async delete(req, res) {
    try {
      await CategoryModel.delete(req.params.id);
      const updatedList = await CategoryModel.getAll();
      res.json(updatedList);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

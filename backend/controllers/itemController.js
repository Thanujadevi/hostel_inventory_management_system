import { ItemModel } from '../models/ItemModel.js';

export const itemController = {
  async getAll(req, res) {
    try {
      const items = await ItemModel.getAll();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async createOrUpdate(req, res) {
    try {
      const itemData = req.body;
      if (itemData.int_Item_Id) {
        await ItemModel.update(itemData.int_Item_Id, itemData);
      } else {
        await ItemModel.create(itemData);
      }
      const updatedList = await ItemModel.getAll();
      res.json(updatedList);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async delete(req, res) {
    try {
      await ItemModel.delete(req.params.id);
      const updatedList = await ItemModel.getAll();
      res.json(updatedList);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

const inventoryService = require('./inventory.service');
const { success, paginated } = require('../../utils/responseHelper');

const getInventory = async (req, res, next) => {
  try {
    const { bookId, branchId, page = '1', limit = '20' } = req.query;
    const result = await inventoryService.getInventory({
      bookId: bookId ? parseInt(bookId, 10) : undefined,
      branchId: branchId ? parseInt(branchId, 10) : undefined,
      page: parseInt(page, 10),
      limit: Math.min(parseInt(limit, 10), 100),
    });

    return paginated(res, {
      data: result.inventory,
      total: result.total,
      page: result.page,
      limit: result.limit,
      message: 'Inventory retrieved successfully',
    });
  } catch (err) {
    next(err);
  }
};

const addStock = async (req, res, next) => {
  try {
    const inventory = await inventoryService.addStock(req.body);
    return success(res, {
      data: inventory,
      message: 'Stock added successfully',
      statusCode: 201,
    });
  } catch (err) {
    next(err);
  }
};

const transferStock = async (req, res, next) => {
  try {
    const result = await inventoryService.transferStock(req.body);
    return success(res, { data: result, message: 'Stock transferred successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getInventory, addStock, transferStock };

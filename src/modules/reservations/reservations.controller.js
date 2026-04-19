const reservationsService = require('./reservations.service');
const { success } = require('../../utils/responseHelper');

const createReservation = async (req, res, next) => {
  try {
    const reservation = await reservationsService.createReservation(req.user.id, req.body);
    return success(res, {
      data: reservation,
      message: 'Reservation created successfully',
      statusCode: 201,
    });
  } catch (err) {
    next(err);
  }
};

const cancelReservation = async (req, res, next) => {
  try {
    const reservation = await reservationsService.cancelReservation(
      req.user.id,
      parseInt(req.params.id, 10)
    );
    return success(res, { data: reservation, message: 'Reservation cancelled' });
  } catch (err) {
    next(err);
  }
};

const getMyReservations = async (req, res, next) => {
  try {
    const reservations = await reservationsService.getMyReservations(req.user.id);
    return success(res, { data: reservations, message: 'Reservations retrieved successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createReservation, cancelReservation, getMyReservations };

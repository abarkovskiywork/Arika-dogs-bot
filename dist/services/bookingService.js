"use strict";
const prisma = require("../db/prisma");
async function createBooking(data) {
    return prisma.booking.create({ data });
}
async function getBookingById(id) {
    return prisma.booking.findUnique({
        where: { id }
    });
}
async function updateBookingStatus(id, status) {
    return prisma.booking.update({
        where: { id },
        data: { status }
    });
}
module.exports = {
    createBooking,
    getBookingById,
    updateBookingStatus
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAllowed = isAllowed;
function isAllowed(id) {
    const allowed = [
        process.env.ADMIN_CHAT_ID,
        process.env.SASHA_CHAT_ID,
    ];
    return allowed.includes(String(id));
}

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrCreateDefaultUser = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getOrCreateDefaultUser = async () => {
    const defaultEmail = 'demo@example.com';
    let user = await prisma_1.default.user.findUnique({
        where: { email: defaultEmail }
    });
    if (!user) {
        console.log('Creating default demo user...');
        user = await prisma_1.default.user.create({
            data: {
                email: defaultEmail,
                name: 'Demo User',
                password: 'hashed_password_placeholder', // In a real app, hash this!
            }
        });
    }
    return user;
};
exports.getOrCreateDefaultUser = getOrCreateDefaultUser;

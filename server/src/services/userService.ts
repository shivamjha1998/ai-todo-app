import prisma from '../prisma';

export const getOrCreateDefaultUser = async () => {
    const defaultEmail = 'demo@example.com';

    let user = await prisma.user.findUnique({
        where: { email: defaultEmail }
    });

    if (!user) {
        console.log('Creating default demo user...');
        user = await prisma.user.create({
            data: {
                email: defaultEmail,
                name: 'Demo User',
                password: 'hashed_password_placeholder',
            }
        });
    }

    return user;
};

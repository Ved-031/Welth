import { db } from "./prisma";
import { currentUser } from "@clerk/nextjs/server";

export const CheckUser = async () => {
    const user = await currentUser();

    if(!user) return null;

    try {
        const userFromDb = await db.user.findUnique({
            where: {
                clerkUserId: user.id,
            },
        });

        if(userFromDb) return userFromDb;

        const name = `${user.firstName} ${user.lastName}`;

        const newUser = await db.user.create({
            data: {
                clerkUserId: user.id,
                name,
                email: user.emailAddresses[0].emailAddress,
                imageUrl: user.imageUrl,
            },
        })

        return newUser;
    } catch (error) {
        console.log(error);
    }
}
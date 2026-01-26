import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const password = await bcrypt.hash('password123', 10)

    // specific User
    const user = await prisma.user.upsert({
        where: { email: 'student@example.com' },
        update: {},
        create: {
            email: 'student@example.com',
            name: 'Student Demo',
            password,
            educationLevel: 'Undergraduate',
            userProgress: {
                create: {
                    studyHours: 12.5,
                    tasksCompleted: 45,
                    streakDays: 3
                }
            }
        },
    })

    // Create a Resume
    await prisma.resume.create({
        data: {
            userId: user.id,
            title: "Software Engineering Resume",
            content: {
                summary: "Aspiring software engineer...",
                skills: ["React", "Node.js", "MySQL"]
            }
        }
    })

    console.log({ user })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })

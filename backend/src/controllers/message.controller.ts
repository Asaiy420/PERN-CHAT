import { Request, Response } from "express";
import prisma from "../db/prisma.js";

export const sendMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { message } = req.body;
    const { id: receiverId } = req.params; // id of the user to whom the message is sent
    const senderId = req.user.id; // id of the user who is sending the message

    let conversation = await prisma.conversation.findFirst({
      where: {
        // Check if a conversation already exists between the sender and receiver
        participantIds: {
          hasEvery: [senderId, receiverId],
        },
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        // Create a new conversation if it doesn't exist
        data: {
          participantIds: {
            set: [senderId, receiverId],
          },
        },
      });
    }
    // Create a new message in the conversation
    const newMessage = await prisma.message.create({
      data: {
        senderId,
        body: message,
        conversationId: conversation.id,
      },
    });

    // Update the conversation with the new message
    if (newMessage) {
      conversation = await prisma.conversation.update({
        where: {
          id: conversation.id,
        },
        data: {
          messages: {
            connect: {
              id: newMessage.id,
            },
          },
        },
      });
    }

    //socket io will go here later

    res.status(201).json(newMessage);
  } catch (error: any) {
    console.error("Error in sendMessage controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getMessages = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id: userToChatId } = req.params;
    const senderId = req.user.id;

    const conversation = await prisma.conversation.findFirst({
      where: {
        participantIds: {
          hasEvery: [senderId, userToChatId],
        },
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!conversation) {
      res.status(200).json([]);
      return;
    }

    res.status(200).json(conversation.messages);
  } catch (error: any) {
    console.error("Error in getMessage controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getUsersForSidebar = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authUserId = req.user.id;
    const users = await prisma.user.findMany({
      where: {
        id: {
          not: authUserId,
        },
      },
      select: {
        id: true,
        fullName: true,
        profilePic: true,
      },
    });

    res.status(200).json(users);
    
  } catch (error: any) {
    console.error("Error in getUsersForSidebar controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

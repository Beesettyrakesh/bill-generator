import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import clientPromise from '../../../lib/mongodb';
import { hash } from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check if user is authenticated and has admin role
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.role !== 'family') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const client = await clientPromise;
  const db = client.db('bill-generator');
  const usersCollection = db.collection('users');

  switch (req.method) {
    case 'GET': {
      const users = await usersCollection.find({}, { projection: { password: 0 } }).toArray();
      return res.status(200).json(users);
    }

    case 'POST': {
      const { username, password, name, role, email } = req.body as {
        username: string;
        password: string;
        name: string;
        role: string;
        email?: string;
      };

      if (!username || !password || !name || !role) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const userEmail = email || `${username}@example.com`;

      const existingUser = await usersCollection.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      const hashedPassword = await hash(password, 10);

      const newUser = {
        id: username,
        username,
        password: hashedPassword,
        name,
        role,
        email: userEmail,
        createdAt: new Date(),
      };

      await usersCollection.insertOne(newUser);

      const { password: _pw, ...userWithoutPassword } = newUser;
      void _pw;
      return res.status(201).json(userWithoutPassword);
    }

    case 'PUT': {
      const { id, ...updateData } = req.body as { id: string; password?: string; [key: string]: unknown };

      if (!id) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      if (updateData.password) {
        updateData.password = await hash(updateData.password as string, 10);
      }

      const result = await usersCollection.updateOne(
        { id },
        { $set: { ...updateData, updatedAt: new Date() } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json({ success: true, message: 'User updated' });
    }

    case 'DELETE': {
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const deleteResult = await usersCollection.deleteOne({ id: userId });

      if (deleteResult.deletedCount === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json({ success: true, message: 'User deleted' });
    }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import clientPromise from "../../../lib/mongodb";
import { hash } from "bcryptjs";

export default async function handler(req, res) {
  // Check if user is authenticated and has admin role
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.role !== "family") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const client = await clientPromise;
  const db = client.db("bill-generator");
  const usersCollection = db.collection("users");

  // Handle different HTTP methods
  switch (req.method) {
    case "GET":
      // List users
      const users = await usersCollection.find({}, { projection: { password: 0 } }).toArray();
      return res.status(200).json(users);

    case "POST":
      // Create new user
      const { username, password, name, role, email } = req.body;
      
      // Validate input
      if (!username || !password || !name || !role) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      // Use username as email if not provided
      const userEmail = email || `${username}@example.com`;
      
      // Check if user already exists
      const existingUser = await usersCollection.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      // Hash password
      const hashedPassword = await hash(password, 10);
      
      // Create user
      const newUser = {
        id: username,
        username,
        password: hashedPassword,
        name,
        role,
        email: userEmail,
        createdAt: new Date()
      };
      
      await usersCollection.insertOne(newUser);
      
      // Return user without password
      const userWithoutPassword = { ...newUser };
      delete userWithoutPassword.password;
      return res.status(201).json(userWithoutPassword);

    case "PUT":
      // Update existing user
      const { id, ...updateData } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      // Hash password if provided
      if (updateData.password) {
        updateData.password = await hash(updateData.password, 10);
      }
      
      const result = await usersCollection.updateOne(
        { id },
        { $set: { ...updateData, updatedAt: new Date() } }
      );
      
      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      
      return res.status(200).json({ success: true, message: "User updated" });

    case "DELETE":
      // Delete user
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      const deleteResult = await usersCollection.deleteOne({ id: userId });
      
      if (deleteResult.deletedCount === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      
      return res.status(200).json({ success: true, message: "User deleted" });

    default:
      res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

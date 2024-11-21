// main.ts

import { MongoClient, ObjectId } from "mongodb";
import { TaskModel } from "./types.ts";
import { fromModelToTask } from "./utils.ts";

// Fetch the MongoDB connection URL from environment variables
const MONGO_URL = Deno.env.get("MONGO_URL");

// Check if MONGO_URL exists; if not, log an error and exit
if (!MONGO_URL) {
  console.error("MONGO_URL is not set");
  Deno.exit(1);
}

// Create a new MongoDB client and connect to the server
const client = new MongoClient(MONGO_URL);
await client.connect();
console.info("Connected to MongoDB");

// Select the 'agenda' database and the 'users' collection
const db = client.db("agenda");
const taskCollection = db.collection<TaskModel>("tasks");

// Main handler function to manage incoming HTTP requests
const handler = async (req: Request): Promise<Response> => {
  const method = req.method; // Get HTTP method (GET, POST, etc.)
  const url = new URL(req.url); // Parse the URL of the request
  const path = url.pathname; // Get the path from the URL

  // Handle different HTTP methods
  if (method === "GET") {
    if (path === "/tasks") {
      const name = url.searchParams.get("title"); 
      const query = name ? { name } : {}; 
      const usersDB = await taskCollection.find(query).toArray(); 

      const users = await Promise.all(
        usersDB.map((user) => fromModelToTask(user)),
      );
      return new Response(JSON.stringify(users));
    } if (path.startsWith("/task/")) {
      const idPath = path.split("/")[2];
  
      const userDB = await taskCollection.findOne({ _id : new ObjectId(idPath) });
      if (!userDB) {
        return new Response(
          JSON.stringify({ error: "Task no encontrada" }),
          { status: 404});
      }
      const user = await fromModelToTask(userDB);
      return new Response(JSON.stringify(user));
    }
  } else if (method === "POST") {
    if (path.startsWith("/tasks")) {
      const data = await req.json(); 
      const { title } = data;
      const completed = false;

      if (!title) {
        return new Response(
          JSON.stringify({
            error: "Title is required",}),
          { status: 400 });
      } 

      const insertResult = await taskCollection.insertOne({
        title,
        completed,
      });
      console.log(insertResult);

      const insertedTask = await taskCollection.findOne({
        _id : insertResult.insertedId,
      });

      const response = {
        message: "Tarea creada exitosamente",
        tarea: await fromModelToTask(insertedTask!),
      };

      return new Response(JSON.stringify(response), {status: 201});
    }
  } else if (method === "PUT") {
    if (path.startsWith("/task/")) {
      const idPath = path.split("/")[2];
      const data = await req.json(); 
      const { title, completed } = data; 

      if (!completed) {
        return new Response(JSON.stringify({ error: "Faltan datos" }), {
          status: 400,
          });
      }
      const user = await taskCollection.findOne({ _id : new ObjectId(idPath) });
      if (!user) {
        return new Response(
          JSON.stringify({ error: "Tarea no encontrada" }),
          { status: 404 },
        );
      }
      await taskCollection.updateOne(
        { _id : new ObjectId(idPath) },
        { $set: { title, completed } },
      );

      const updatedUser = await taskCollection.findOne({ title });

      const response = {
        message: "Tarea actualizada exitosamente",
        tarea: await fromModelToTask(updatedUser!),
      };
      return new Response(JSON.stringify(response));

    }
  } else if (method === "DELETE") {
    if (path.startsWith("/tasks/")) {
      const SPath = path.split("/")[2];

      if (!SPath) {
        return new Response(JSON.stringify({ error: "Id requerido" }), {status: 400});
      }    
      await taskCollection.deleteOne({ _id : new ObjectId(SPath) });

      return new Response(JSON.stringify("Tarea eliminada"));
    }
  }

  // If no matching route is found, return a 404 response
  return new Response("Not found", { status: 404 });
};

// Start the server on port 3000 and use the handler function to process requests
Deno.serve({ port: 3000 }, handler);
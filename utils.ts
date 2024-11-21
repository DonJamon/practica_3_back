import { Collection, ObjectId } from "mongodb";
import { Task, TaskModel } from "./types.ts";


export const fromModelToTask = async (
  model: TaskModel
): Promise<Task> => {
  return {
    id: model._id!.toString(),
    title: model.name,
    completed: model.email,
  };
};
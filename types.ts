import { OptionalId } from "mongodb";

export type Task = {
  id: string;
  title: string;
  completed: boolean;
};

export type TaskModel = OptionalId<{
  title: string;
  completed: boolean;
}>;
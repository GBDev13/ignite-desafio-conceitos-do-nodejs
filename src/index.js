const express = require("express");
const cors = require("cors");

const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.find((user) => user.username === username);

  if (!user) {
    return response.status(404).json({ error: "User not found" });
  }

  request.username = user;

  return next();
}

function checksExistsTodoUser(request, response, next) {
  const { id } = request.params;
  const { username } = request;

  const todos = username.todos;

  const todo = todos.find((todo) => todo.id === id);

  if (!todo) {
    return response.status(404).send({ error: "todo not found" });
  }

  request.todo = todo;

  return next();
}

app.post("/users", (request, response) => {
  const { name, username } = request.body;

  const userAlreadyExists = users.some((user) => user.username === username);

  if (userAlreadyExists) {
    return response.status(400).json({ error: "User already exists" });
  }

  const user = {
    id: uuidv4(),
    name,
    username,
    todos: [],
  };

  users.push(user);

  return response.status(201).json(user);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { username } = request;
  return response.json(username.todos);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const { username } = request;
  const { title, deadline } = request.body;

  const todo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  };

  username.todos.push(todo);

  return response.status(201).json(todo);
});

app.put(
  "/todos/:id",
  checksExistsUserAccount,
  checksExistsTodoUser,
  (request, response) => {
    const { todo } = request;
    const { title, deadline } = request.body;

    todo.title = title;
    todo.deadline = new Date(deadline);

    return response.status(201).json(todo);
  }
);

app.patch(
  "/todos/:id/done",
  checksExistsUserAccount,
  checksExistsTodoUser,
  (request, response) => {
    const { todo } = request;

    todo.done = !todo.done;

    return response.status(201).json(todo);
  }
);

app.delete("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { username } = request;
  const { id } = request.params;

  const todoExists = username.todos.some((todo) => todo.id === id);

  if (!todoExists) {
    return response.status(404).json({ error: "Todo not exists" });
  }

  const updatedTodos = username.todos.filter((todo) => todo.id !== id);

  username.todos = updatedTodos;
  return response.status(204).send();
});

module.exports = app;

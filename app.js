const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const format = require("date-fns/format");
const parseISO = require("date-fns/parseISO");
const isValid = require("date-fns/isValid");

const app = express();
app.use(express.json());

const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
const priorityArray = ["HIGH", "MEDIUM", "LOW"];
const categoryArray = ["WORK", "HOME", "LEARNING"];

const dataBasePath = path.join(__dirname, "todoApplication.db");

let dataBase = null;

const initializeDBAndServer = async () => {
  try {
    dataBase = await open({
      filename: dataBasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server started running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const todoObjectToResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

const hasStatusAndPriorityAndCategory = (requestQuery) => {
  return (
    requestQuery.status !== undefined &&
    requestQuery.priority !== undefined &&
    requestQuery.category !== undefined
  );
};

const hasStatusAndPriority = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  );
};

const hasStatusAndCategory = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.category !== undefined
  );
};

const hasPriorityAndCategory = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.category !== undefined
  );
};

const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasCategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const validQueryParameters = (request, response, next) => {
  const { status, priority, category, search_q = "" } = request.query;

  switch (true) {
    case hasStatus(request.query):
      if (statusArray.includes(status)) {
        next();
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case hasPriority(request.query):
      if (priorityArray.includes(priority)) {
        next();
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case hasCategory(request.query):
      if (categoryArray.includes(category)) {
        next();
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    default:
      if (search_q === "" || search_q !== "") {
        next();
      }
      break;
  }
};

app.get("/todos/", validQueryParameters, async (request, response) => {
  const { status, priority, category, search_q = "" } = request.query;
  let data = null;
  let getTodosQuery = "";

  switch (true) {
    case hasStatusAndPriorityAndCategory(request.query):
      getTodosQuery = `
            SELECT
                *
            FROM
                todo
            WHERE
                todo LIKE '%${search_q}%'
                AND status = '${status}'
                AND priority = '${priority}'
                AND category = '${category}';`;
      break;
    case hasStatusAndPriority(request.query):
      getTodosQuery = `
            SELECT
                *
            FROM
                todo
            WHERE
                todo LIKE '%${search_q}%'
                AND status = '${status}'
                AND priority = '${priority}';`;
      break;
    case hasStatusAndCategory(request.query):
      getTodosQuery = `
            SELECT
                *
            FROM
                todo
            WHERE
                todo LIKE '%${search_q}%'
                AND status = '${status}'
                AND category = '${category}';`;
      break;
    case hasPriorityAndCategory(request.query):
      getTodosQuery = `
            SELECT
                *
            FROM
                todo
            WHERE
                todo LIKE '%${search_q}%'
                AND priority = '${priority}'
                AND category = '${category}';`;
      break;
    case hasStatus(request.query):
      getTodosQuery = `
            SELECT
                *
            FROM
                todo
            WHERE
                todo LIKE '%${search_q}%'
                AND status = '${status}';`;
      break;
    case hasPriority(request.query):
      getTodosQuery = `
            SELECT
                *
            FROM
                todo
            WHERE
                todo LIKE '%${search_q}%'
                AND priority = '${priority}';`;
      break;
    case hasCategory(request.query):
      getTodosQuery = `
            SELECT
                *
            FROM
                todo
            WHERE
                todo LIKE '%${search_q}%'
                AND category = '${category}';`;
      break;

    default:
      getTodosQuery = `
            SELECT
                *
            FROM
                todo
            WHERE
                todo LIKE '%${search_q}%'`;
      break;
  }
  data = await dataBase.all(getTodosQuery);
  response.send(data.map((eachTodo) => todoObjectToResponseObject(eachTodo)));
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
  SELECT 
    * 
  FROM
    todo
  WHERE
    id LIKE ${todoId};`;

  const todo = await dataBase.get(getTodoQuery);
  response.send(todoObjectToResponseObject(todo));
});

const validateDate = (request, response, next) => {
  const { date } = request.query;
  let dateNdDate = new Date(date);
  const validDate = isValid(dateNdDate);

  if (validDate === true) {
    newDate = format(new Date(dateNdDate), "yyyy-MM-dd");
    console.log(newDate);
    next();
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
};

app.get("/agenda/", validateDate, async (request, response) => {
  const getTodoQuery = `
        SELECT 
            * 
        FROM
            todo
        WHERE
            due_date = '${newDate}';`;
  const todo = await dataBase.all(getTodoQuery);
  response.send(todo.map((eachTodo) => todoObjectToResponseObject(eachTodo)));
});

module.exports = app;

import database from "infra/database.js";
import { ValidationError, NotFoundError } from "infra/errors.js";
import password from "models/password.js";

async function findOneByUsername(username) {
  const userFound = await runSelectQuery(username);
  return userFound;

  async function runSelectQuery(username) {
    const results = await database.query({
      text: `
      SELECT 
        * 
      FROM 
        users
      WHERE
        LOWER(username) = LOWER($1)
      LIMIT
        1
      ;`,
      values: [username],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "Usuário não encontrado.",
        action: "Verifique o nome de usuário informado.",
        status_code: 404,
      });
    }

    return results.rows[0];
  }
}

async function create(userImputValues) {
  await validateUniqueEmail(userImputValues.email);
  await validateUniqueUsername(userImputValues.username);
  await hashPasswordInObject(userImputValues);

  const newUser = await runInsertQuery(userImputValues);
  return newUser;

  async function validateUniqueEmail(email) {
    const results = await database.query({
      text: `
      SELECT 
        email 
      FROM 
        users
      WHERE
        LOWER(email) = LOWER($1)
      ;`,
      values: [email],
    });
    if (results.rowCount > 0) {
      throw new ValidationError({
        message: "Email informado já está em uso.",
        action: "Utilize outro email para cadastrar o usuário.",
      });
    }
  }
  async function validateUniqueUsername(username) {
    const results = await database.query({
      text: `
      SELECT 
        username 
      FROM 
        users
      WHERE
        LOWER(username) = LOWER($1)
      ;`,
      values: [username],
    });
    if (results.rowCount > 0) {
      throw new ValidationError({
        message: "Nome de usuário já está em uso.",
        action: "Utilize outro nome de usuário para continuar o cadastro.",
      });
    }
  }

  async function hashPasswordInObject(userImputValues) {
    const hashedPassword = await password.hash(userImputValues.password);
    userImputValues.password = hashedPassword;
  }

  async function runInsertQuery(userImputValues) {
    const results = await database.query({
      text: `
      INSERT INTO 
        users (username, email, password) 
      VALUES 
        ($1, $2, $3)
      RETURNING 
        *
      ;`,
      values: [
        userImputValues.username,
        userImputValues.email,
        userImputValues.password,
      ],
    });
    return results.rows[0];
  }
}
const user = {
  create,
  findOneByUsername,
};
export default user;

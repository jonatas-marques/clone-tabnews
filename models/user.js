import database from "infra/database.js";
import { ValidationError } from "infra/errors.js";

async function create(userImputValues) {
  await validateUniqueEmail(userImputValues.email);
  await validateUniqueUsername(userImputValues.username);

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
};
export default user;

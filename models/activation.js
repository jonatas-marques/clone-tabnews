import database from "infra/database.js";
import email from "infra/email.js";
import webserver from "infra/webserver.js";

const EXPIRATION_IN_MILISECONDS = 60 * 15 * 1000; // 15 minutos

async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILISECONDS);
  const newToken = await runInsertQuery(userId, expiresAt);
  return newToken;

  async function runInsertQuery(userId, expiresAt) {
    const results = await database.query({
      text: `
      INSERT INTO 
        user_activation_tokens (user_id, expires_at) 
      VALUES 
        ($1, $2)
      RETURNING 
        *
      ;`,
      values: [userId, expiresAt],
    });
    return results.rows[0];
  }
}

async function sendEmailtoUser(user, activationToken) {
  await email.send({
    from: "<contato@curso.dev>",
    to: user.email,
    subject: "Ative sua conta no Clone TabNews",
    text: `${user.username}, clique no link abaixo para ativar sua conta:\n\n${webserver.origin}/cadastro/ativar/${activationToken.id}\n\nAtenciosamente,\nEquipe`,
  });
}

async function findOneByUserId(userId) {
  const newToken = await runSelectQuery(userId);
  return newToken;

  async function runSelectQuery(userId) {
    const results = await database.query({
      text: `
      SELECT 
        *
      FROM 
        user_activation_tokens
      WHERE 
        user_id = $1
      LIMIT 1
      ;`,
      values: [userId],
    });
    return results.rows[0];
  }
}

const activation = {
  create,
  sendEmailtoUser,
  findOneByUserId,
};

export default activation;

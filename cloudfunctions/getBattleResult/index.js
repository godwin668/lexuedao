/**
 * getBattleResult - 获取对战结果
 */
const cloud = require('wx-server-sdk')
const { Client } = require('pg')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const client = new Client({
    connectionString: process.env.PG_CONNECTION_STRING,
  })

  try {
    const { roomId } = event

    await client.connect()

    const result = await client.query(
      `SELECT br.id, br.subject, br.player1_id, br.player2_id,
              br.player1_score, br.player2_score, br.winner_id, br.status,
              br.created_at,
              p1.nickname as player1_name, p1.avatar_url as player1_avatar,
              p2.nickname as player2_name, p2.avatar_url as player2_avatar
       FROM battle_records br
       LEFT JOIN users p1 ON p1.id = br.player1_id
       LEFT JOIN users p2 ON p2.id = br.player2_id
       WHERE br.id = $1`,
      [roomId]
    )

    if (result.rows.length === 0) {
      return { code: -1, message: '对战不存在', data: null }
    }

    const row = result.rows[0]

    // 如果未结束，判断胜负
    let winnerId = row.winner_id
    if (row.status === 'playing' && !winnerId) {
      if (row.player1_score > row.player2_score) {
        winnerId = row.player1_id
      } else if (row.player2_score > row.player1_score) {
        winnerId = row.player2_id
      }
    }

    return {
      code: 0,
      message: 'success',
      data: {
        roomId: row.id,
        subject: row.subject,
        status: row.status,
        player1: {
          userId: row.player1_id,
          nickname: row.player1_name,
          avatarUrl: row.player1_avatar,
          score: row.player1_score,
        },
        player2: row.player2_id ? {
          userId: row.player2_id,
          nickname: row.player2_name,
          avatarUrl: row.player2_avatar,
          score: row.player2_score,
        } : null,
        winnerId,
        createdAt: row.created_at,
      },
    }
  } catch (err) {
    console.error('[getBattleResult] error:', err)
    return { code: -1, message: err.message || '服务异常', data: null }
  } finally {
    await client.end()
  }
}

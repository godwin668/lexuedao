/**
 * startBattle - 发起/匹配对战
 */
const cloud = require('wx-server-sdk')
const { Client } = require('pg')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const client = new Client({
    connectionString: process.env.PG_CONNECTION_STRING,
  })

  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    const { subject = 'hanzi', opponentId } = event

    await client.connect()

    const userResult = await client.query(
      'SELECT id FROM users WHERE openid = $1',
      [openid]
    )
    if (userResult.rows.length === 0) {
      return { code: -1, message: '用户不存在', data: null }
    }
    const userId = userResult.rows[0].id

    let player2Id = opponentId || null

    // 如果没有指定对手，尝试匹配等待中的对战
    if (!player2Id) {
      const matchResult = await client.query(
        `SELECT id, player1_id FROM battle_records
         WHERE subject = $1 AND status = 'matching' AND player1_id != $2
         ORDER BY created_at ASC
         LIMIT 1`,
        [subject, userId]
      )

      if (matchResult.rows.length > 0) {
        const match = matchResult.rows[0]
        player2Id = match.player1_id

        // 更新为 playing 状态
        await client.query(
          `UPDATE battle_records
           SET player2_id = $1, status = 'playing'
           WHERE id = $2`,
          [userId, match.id]
        )

        return {
          code: 0,
          message: 'success',
          data: { roomId: match.id, matched: true },
        }
      }
    }

    // 创建新对战
    const result = await client.query(
      `INSERT INTO battle_records (subject, player1_id, player2_id, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [subject, userId, player2Id, player2Id ? 'playing' : 'matching']
    )

    return {
      code: 0,
      message: 'success',
      data: { roomId: result.rows[0].id, matched: !!player2Id },
    }
  } catch (err) {
    console.error('[startBattle] error:', err)
    return { code: -1, message: err.message || '服务异常', data: null }
  } finally {
    await client.end()
  }
}

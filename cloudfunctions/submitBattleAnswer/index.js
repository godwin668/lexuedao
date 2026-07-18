/**
 * submitBattleAnswer - 提交对战答案
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
    const { roomId, questionIndex, answer } = event

    await client.connect()

    const userResult = await client.query(
      'SELECT id FROM users WHERE openid = $1',
      [openid]
    )
    if (userResult.rows.length === 0) {
      return { code: -1, message: '用户不存在', data: null }
    }
    const userId = userResult.rows[0].id

    // 验证对战状态
    const battleResult = await client.query(
      `SELECT id, player1_id, player2_id, player1_score, player2_score, status
       FROM battle_records WHERE id = $1`,
      [roomId]
    )
    if (battleResult.rows.length === 0) {
      return { code: -1, message: '对战不存在', data: null }
    }

    const battle = battleResult.rows[0]
    if (battle.status !== 'playing') {
      return { code: -1, message: '对战已结束', data: null }
    }

    // 简单评分逻辑：根据答案正确性给分
    const correct = answer?.correct !== false
    const score = correct ? 10 : 0

    // 更新分数
    if (userId === battle.player1_id) {
      await client.query(
        `UPDATE battle_records SET player1_score = player1_score + $1 WHERE id = $2`,
        [score, roomId]
      )
    } else if (userId === battle.player2_id) {
      await client.query(
        `UPDATE battle_records SET player2_score = player2_score + $1 WHERE id = $2`,
        [score, roomId]
      )
    }

    return { code: 0, message: 'success', data: { correct, score } }
  } catch (err) {
    console.error('[submitBattleAnswer] error:', err)
    return { code: -1, message: err.message || '服务异常', data: null }
  } finally {
    await client.end()
  }
}

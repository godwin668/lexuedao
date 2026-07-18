/**
 * claimDailyReward - 领取每日挑战奖励
 */
const cloud = require('wx-server-sdk')
const { Client } = require('pg')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const REWARD = { exp: 50, coins: 30 }

exports.main = async (event, context) => {
  const client = new Client({
    connectionString: process.env.PG_CONNECTION_STRING,
  })

  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID

    await client.connect()

    const userResult = await client.query(
      'SELECT id FROM users WHERE openid = $1',
      [openid]
    )
    if (userResult.rows.length === 0) {
      return { code: -1, message: '用户不存在' }
    }
    const userId = userResult.rows[0].id

    // 检查今日是否已领取
    const today = new Date().toISOString().split('T')[0]
    const claimedResult = await client.query(
      `SELECT id FROM currency_log
       WHERE user_id = $1 AND reason = 'daily_challenge_reward' AND created_at::date = $2`,
      [userId, today]
    )
    if (claimedResult.rows.length > 0) {
      return { code: -1, message: '今日已领取奖励' }
    }

    // 发放奖励
    await client.query(
      `UPDATE user_game_profile
       SET exp = exp + $1, coins = coins + $2
       WHERE user_id = $3`,
      [REWARD.exp, REWARD.coins, userId]
    )

    // 记录流水
    await client.query(
      `INSERT INTO currency_log (user_id, currency, amount, reason)
       VALUES ($1, 'exp', $2, 'daily_challenge_reward')`,
      [userId, REWARD.exp]
    )
    await client.query(
      `INSERT INTO currency_log (user_id, currency, amount, reason)
       VALUES ($1, 'coin', $2, 'daily_challenge_reward')`,
      [userId, REWARD.coins]
    )

    return {
      code: 0,
      message: 'ok',
      data: { exp: REWARD.exp, coins: REWARD.coins },
    }
  } catch (err) {
    console.error('[claimDailyReward] error:', err)
    return { code: -1, message: err.message || '服务异常' }
  } finally {
    await client.end().catch(() => {})
  }
}

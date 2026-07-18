/**
 * createTeam - 创建队伍
 */
const cloud = require('wx-server-sdk')
const { Client } = require('pg')
const crypto = require('crypto')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const client = new Client({
    connectionString: process.env.PG_CONNECTION_STRING,
  })

  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    const { name } = event

    if (!name || !name.trim()) {
      return { code: -1, message: '队伍名称不能为空' }
    }

    await client.connect()

    const userResult = await client.query(
      'SELECT id, nickname FROM users WHERE openid = $1',
      [openid]
    )
    if (userResult.rows.length === 0) {
      return { code: -1, message: '用户不存在' }
    }
    const userId = userResult.rows[0].id

    // 检查是否已在队伍中
    const existing = await client.query(
      'SELECT id FROM team_members WHERE user_id = $1',
      [userId]
    )
    if (existing.rows.length > 0) {
      return { code: -1, message: '你已经在队伍中，请先离开当前队伍' }
    }

    // 生成队伍码
    const code = crypto.randomBytes(3).toString('hex').toUpperCase()

    const teamResult = await client.query(
      `INSERT INTO teams (name, code, captain_id, total_score, current_stage, total_stages)
       VALUES ($1, $2, $3, 0, 1, 10)
       RETURNING id, name, code, captain_id, total_score, current_stage, total_stages`,
      [name.trim(), code, userId]
    )
    const team = teamResult.rows[0]

    await client.query(
      `INSERT INTO team_members (team_id, user_id)
       VALUES ($1, $2)`,
      [team.id, userId]
    )

    return {
      code: 0,
      message: 'ok',
      data: {
        id: team.id,
        name: team.name,
        code: team.code,
        captainId: team.captain_id,
        totalScore: team.total_score,
        currentStage: team.current_stage,
        totalStages: team.total_stages,
        members: [{ id: userId, nickname: userResult.rows[0].nickname }],
      },
    }
  } catch (err) {
    console.error('[createTeam] error:', err)
    return { code: -1, message: err.message || '服务异常' }
  } finally {
    await client.end().catch(() => {})
  }
}

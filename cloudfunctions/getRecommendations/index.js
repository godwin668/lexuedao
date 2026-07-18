/**
 * getRecommendations - AI 推荐练习题
 * 根据用户薄弱标签从知识库中推荐匹配的知识点
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

    const { subject, count = 5 } = event

    await client.connect()

    // 获取用户 ID
    const userResult = await client.query(
      'SELECT id, grade FROM users WHERE openid = $1',
      [openid]
    )
    if (userResult.rows.length === 0) {
      return { code: -1, message: '用户不存在' }
    }
    const userId = userResult.rows[0].id
    const userGrade = userResult.rows[0].grade

    let items = []

    // 查询用户能力画像中的薄弱标签
    let profileQuery = 'SELECT subject, weak_tags FROM user_skill_profile WHERE user_id = $1'
    const profileParams = [userId]
    if (subject) {
      profileQuery += ' AND subject = $2'
      profileParams.push(subject)
    }
    const profileResult = await client.query(profileQuery, profileParams)

    const weakTags = []
    const subjectsToQuery = []
    for (const row of profileResult.rows) {
      subjectsToQuery.push(row.subject)
      if (row.weak_tags && row.weak_tags.length > 0) {
        weakTags.push(...row.weak_tags)
      }
    }

    // 如果有薄弱标签，按标签匹配知识点
    if (weakTags.length > 0) {
      const tagConditions = weakTags.map((_, i) => `tags @> ARRAY[$<span class="math-inline">\{i + 1\}\]`).join(' OR ')
      let tagQuery = `SELECT item_key, item_name, subject, grade, difficulty, tags
        FROM knowledge_vectors
        WHERE (` + weakTags.map((_, i) => `tags @> $${i + 1}`).join(' OR ') + `)`
      const tagParams = weakTags.map(t => `{${t}}`)

      if (subject) {
        tagQuery += ` AND subject = $${tagParams.length + 1}`
        tagParams.push(subject)
      }

      tagQuery += ` ORDER BY RANDOM() LIMIT $${tagParams.length + 1}`
      tagParams.push(String(count))

      const tagResult = await client.query(tagQuery, tagParams)
      items = tagResult.rows
    }

    // 如果薄弱标签匹配不足，用同年级知识点补充
    if (items.length < count) {
      const remaining = count - items.length
      let fallbackQuery = `SELECT item_key, item_name, subject, grade, difficulty, tags
        FROM knowledge_vectors
        WHERE grade = $1`
      const fallbackParams = [userGrade]

      if (subject) {
        fallbackQuery += ` AND subject = $2`
        fallbackParams.push(subject)
      }

      // 排除已选中的
      if (items.length > 0) {
        const excludeKeys = items.map(i => i.item_key)
        fallbackQuery += ` AND item_key NOT IN (${excludeKeys.map((_, i) => `$${fallbackParams.length + i + 1}`).join(',')})`
        fallbackParams.push(...excludeKeys)
      }

      fallbackQuery += ` ORDER BY RANDOM() LIMIT $${fallbackParams.length + 1}`
      fallbackParams.push(String(remaining))

      const fallbackResult = await client.query(fallbackQuery, fallbackParams)
      items = items.concat(fallbackResult.rows)
    }

    // 如果仍然不足，随机推荐
    if (items.length < count) {
      const remaining = count - items.length
      let randomQuery = `SELECT item_key, item_name, subject, grade, difficulty, tags
        FROM knowledge_vectors`
      const randomParams = []

      if (subject) {
        randomQuery += ` WHERE subject = $1`
        randomParams.push(subject)
      }

      if (items.length > 0) {
        const excludeKeys = items.map(i => i.item_key)
        const whereOrAnd = subject ? 'AND' : 'WHERE'
        randomQuery += ` ${whereOrAnd} item_key NOT IN (${excludeKeys.map((_, i) => `$${randomParams.length + i + 1}`).join(',')})`
        randomParams.push(...excludeKeys)
      }

      randomQuery += ` ORDER BY RANDOM() LIMIT $${randomParams.length + 1}`
      randomParams.push(String(remaining))

      const randomResult = await client.query(randomQuery, randomParams)
      items = items.concat(randomResult.rows)
    }

    return {
      code: 0,
      message: 'ok',
      data: { items }
    }
  } catch (err) {
    console.error('[getRecommendations] error:', err)
    return { code: -1, message: err.message || '服务异常' }
  } finally {
    await client.end().catch(() => {})
  }
}

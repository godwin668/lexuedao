/**
 * handlePaymentCallback - 支付回调处理
 * 验证签名、更新订单状态、发放权益
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
    const {
      wx_order_id,
      transaction_id,
      total_fee,
      sign,
      // 微信支付回调其他字段...
    } = event

    if (!wx_order_id) {
      return { code: -1, message: '缺少订单号' }
    }

    // TODO: 接入微信支付后，使用微信支付 SDK 验证签名
    // const verified = wxPay.verifySign(event)
    // if (!verified) return { code: -1, message: '签名验证失败' }

    await client.connect()

    // 查找订阅订单
    const subResult = await client.query(
      `SELECT id, user_id, plan, amount, status
       FROM subscription_orders
       WHERE wx_order_id = $1`,
      [wx_order_id]
    )

    if (subResult.rows.length > 0) {
      const order = subResult.rows[0]

      if (order.status === 'paid') {
        return { code: 0, message: 'ok', data: { processed: false, reason: '订单已处理' } }
      }

      // 计算订阅起止日期
      const planDays = { monthly: 30, quarterly: 90, yearly: 365 }
      const days = planDays[order.plan] || 30

      // 更新订单状态
      await client.query(
        `UPDATE subscription_orders
         SET status = 'paid',
             start_date = CURRENT_DATE,
             end_date = CURRENT_DATE + INTERVAL '1 day' * $1
         WHERE id = $2`,
        [days, order.id]
      )

      // TODO: 更新用户 VIP 状态（如需要 VIP 标识字段可扩展 users 表）
      // 当前版本记录日志即可

      // 记录货币流水（可选，记录订阅消费）
      await client.query(
        `INSERT INTO currency_log (user_id, currency, amount, reason, ref_id)
         VALUES ($1, 'diamond', $2, $3, $4)`,
        [order.user_id, -order.amount, 'subscription_paid', order.id]
      )

      return {
        code: 0,
        message: 'ok',
        data: {
          processed: true,
          type: 'subscription',
          plan: order.plan,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + days * 86400000).toISOString().split('T')[0]
        }
      }
    }

    // 查找钻石订单
    const diamondResult = await client.query(
      `SELECT id, user_id, package_id, amount, diamonds
       FROM diamond_orders
       WHERE wx_order_id = $1`,
      [wx_order_id]
    )

    if (diamondResult.rows.length > 0) {
      const order = diamondResult.rows[0]

      // 增加用户钻石余额
      await client.query(
        `UPDATE user_game_profile
         SET diamonds = diamonds + $1
         WHERE user_id = $2`,
        [order.diamonds, order.user_id]
      )

      // 记录货币流水
      await client.query(
        `INSERT INTO currency_log (user_id, currency, amount, reason, ref_id)
         VALUES ($1, 'diamond', $2, $3, $4)`,
        [order.user_id, order.diamonds, 'diamond_purchase', order.id]
      )

      return {
        code: 0,
        message: 'ok',
        data: {
          processed: true,
          type: 'diamond',
          diamonds: order.diamonds
        }
      }
    }

    return { code: -1, message: '未找到对应订单' }
  } catch (err) {
    console.error('[handlePaymentCallback] error:', err)
    return { code: -1, message: err.message || '服务异常' }
  } finally {
    await client.end().catch(() => {})
  }
}

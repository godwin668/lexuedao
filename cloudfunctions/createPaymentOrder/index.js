/**
 * createPaymentOrder - 创建支付订单
 * 当前版本返回模拟订单号（后续接入微信支付统一下单 API）
 */
const cloud = require('wx-server-sdk')
const { Client } = require('pg')
const crypto = require('crypto')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 价格配置
const PLAN_PRICES = {
  monthly: { amount: 2990, name: '月度VIP' },    // 29.90 元（分）
  quarterly: { amount: 7990, name: '季度VIP' },   // 79.90 元
  yearly: { amount: 29900, name: '年度VIP' }      // 299.00 元
}

const DIAMOND_PACKAGES = {
  'diamond_60': { amount: 600, diamonds: 60, name: '60钻石' },
  'diamond_180': { amount: 1800, diamonds: 180, name: '180钻石' },
  'diamond_500': { amount: 5000, diamonds: 500, name: '500钻石' },
  'diamond_1200': { amount: 12000, diamonds: 1200, name: '1200钻石' }
}

function generateOrderId() {
  return 'LX' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(4).toString('hex').toUpperCase()
}

exports.main = async (event, context) => {
  const client = new Client({
    connectionString: process.env.PG_CONNECTION_STRING,
  })

  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID

    const { type, plan, packageId } = event

    if (!type || !['subscription', 'diamond'].includes(type)) {
      return { code: -1, message: '无效的订单类型，支持 subscription 或 diamond' }
    }

    await client.connect()

    // 获取用户 ID
    const userResult = await client.query(
      'SELECT id FROM users WHERE openid = $1',
      [openid]
    )
    if (userResult.rows.length === 0) {
      return { code: -1, message: '用户不存在' }
    }
    const userId = userResult.rows[0].id

    const orderId = generateOrderId()
    // 模拟微信支付订单号
    const wxOrderId = 'WX' + Date.now() + crypto.randomBytes(4).toString('hex').toUpperCase()

    if (type === 'subscription') {
      if (!plan || !PLAN_PRICES[plan]) {
        return { code: -1, message: '无效的订阅计划，支持 monthly/quarterly/yearly' }
      }

      const priceInfo = PLAN_PRICES[plan]

      await client.query(
        `INSERT INTO subscription_orders (user_id, plan, amount, status, wx_order_id)
         VALUES ($1, $2, $3, 'pending', $4)`,
        [userId, plan, priceInfo.amount, wxOrderId]
      )

      return {
        code: 0,
        message: 'ok',
        data: {
          orderId,
          wxOrderId,
          type: 'subscription',
          plan,
          planName: priceInfo.name,
          amount: priceInfo.amount
        }
      }
    } else {
      // diamond
      if (!packageId || !DIAMOND_PACKAGES[packageId]) {
        return { code: -1, message: '无效的钻石套餐' }
      }

      const pkg = DIAMOND_PACKAGES[packageId]

      await client.query(
        `INSERT INTO diamond_orders (user_id, package_id, amount, diamonds, wx_order_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, packageId, pkg.amount, pkg.diamonds, wxOrderId]
      )

      return {
        code: 0,
        message: 'ok',
        data: {
          orderId,
          wxOrderId,
          type: 'diamond',
          packageId,
          packageName: pkg.name,
          amount: pkg.amount,
          diamonds: pkg.diamonds
        }
      }
    }
  } catch (err) {
    console.error('[createPaymentOrder] error:', err)
    return { code: -1, message: err.message || '服务异常' }
  } finally {
    await client.end().catch(() => {})
  }
}

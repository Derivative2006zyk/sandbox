/**
 * 获取全部新闻（管理员）
 *
 * 入参说明：
 * @param 无
 * @returns {Object} 统一返回 { code, msg, data }，code 为 0 表示成功
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { code: 401, msg: '无法获取用户身份' }

  // 校验管理员权限
  const userRes = await db.collection('users').where({ _openid: OPENID }).get()
  if (userRes.data.length === 0 || userRes.data[0].role !== 1) {
    return { code: 403, msg: '无权限操作' }
  }

  try {
    // 获取所有新闻，按创建时间倒序，最多 100 条
    const newsRes = await db.collection('news')
      .orderBy('createTime', 'desc')
      .limit(100)
      .get()

    const newsList = newsRes.data

    // 遍历草案公告，附加投票统计
    for (let i = 0; i < newsList.length; i++) {
      if (newsList[i].isDraftProposal) {
        const newsId = newsList[i]._id
        const votesRes = await db.collection('proposal_votes')
          .where({ newsId })
          .get()

        let agreeCount = 0, disagreeCount = 0, abstainCount = 0
        votesRes.data.forEach(item => {
          if (item.vote === 'agree') agreeCount++
          else if (item.vote === 'disagree') disagreeCount++
          else if (item.vote === 'abstain') abstainCount++
        })

        newsList[i].voteStats = {
          agreeCount,
          disagreeCount,
          abstainCount,
          totalCount: votesRes.data.length
        }
      }
    }

    return { code: 0, data: newsList }
  } catch (e) {
    console.error('getAllNews error:', e)
    return { code: 500, msg: '获取新闻列表失败' }
  }
}
/**
 * 获取新闻详情
 *
 * 入参说明：
 * @param newsId 新闻 ID
 * @returns {Object} 统一返回 { code, msg, data }，code 为 0 表示成功
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { newsId } = event
  if (!newsId) return { code: 400, msg: '缺少新闻ID' }

  try {
    const res = await db.collection('news').doc(newsId).get()
    if (!res.data) {
      return { code: 404, msg: '新闻不存在' }
    }

    const news = res.data

    // 如果是草案公告，附带表决统计和当前用户投票
    if (news.isDraftProposal) {
      const votesRes = await db.collection('proposal_votes')
        .where({ newsId })
        .get()

      let agreeCount = 0, disagreeCount = 0, abstainCount = 0
      votesRes.data.forEach(item => {
        if (item.vote === 'agree') agreeCount++
        else if (item.vote === 'disagree') disagreeCount++
        else if (item.vote === 'abstain') abstainCount++
      })

      const myVoteRes = await db.collection('proposal_votes')
        .where({ newsId, openid: OPENID })
        .get()
      const myVote = myVoteRes.data.length > 0 ? myVoteRes.data[0].vote : null

      news.voteInfo = {
        agreeCount,
        disagreeCount,
        abstainCount,
        totalCount: votesRes.data.length,
        myVote
      }
    }

    return { code: 0, data: news }
  } catch (e) {
    console.error('getNewsDetail error:', e)
    return { code: 500, msg: '获取详情失败' }
  }
}
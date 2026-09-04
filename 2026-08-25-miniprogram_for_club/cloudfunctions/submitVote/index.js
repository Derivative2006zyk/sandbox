const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { code: 401, msg: '无法获取用户身份' }

  const { newsId, vote } = event
  if (!newsId || !['agree', 'disagree', 'abstain'].includes(vote)) {
    return { code: 400, msg: '参数错误' }
  }

  try {
    // 检查新闻是否存在且是草案公告
    const newsRes = await db.collection('news').doc(newsId).get()
    if (!newsRes.data) return { code: 404, msg: '公告不存在' }
    if (!newsRes.data.isDraftProposal) return { code: 400, msg: '该公告不支持表决' }

    // 查询用户是否已投过票
    const existing = await db.collection('proposal_votes')
      .where({ newsId, openid: OPENID })
      .get()

    if (existing.data.length > 0) {
      // 更新投票
      await db.collection('proposal_votes').doc(existing.data[0]._id).update({
        data: {
          vote,
          updateTime: db.serverDate()
        }
      })
    } else {
      // 新增投票
      await db.collection('proposal_votes').add({
        data: {
          newsId,
          openid: OPENID,
          vote,
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      })
    }

    // 返回最新统计
    const stats = await getVoteStats(newsId)
    return {
      code: 0,
      msg: '投票成功',
      data: {
        myVote: vote,
        ...stats
      }
    }
  } catch (e) {
    console.error('submitVote error:', e)
    return { code: 500, msg: '投票失败' }
  }
}

// 统计函数
async function getVoteStats(newsId) {
  const votes = await db.collection('proposal_votes')
    .where({ newsId })
    .get()

  let agreeCount = 0, disagreeCount = 0, abstainCount = 0
  votes.data.forEach(item => {
    if (item.vote === 'agree') agreeCount++
    else if (item.vote === 'disagree') disagreeCount++
    else if (item.vote === 'abstain') abstainCount++
  })

  return { agreeCount, disagreeCount, abstainCount, totalCount: votes.data.length }
}
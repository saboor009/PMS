import Project from '../models/Project.js'
import Task from '../models/Task.js'
import User from '../models/User.js'
import { can, hasRoleAtLeast } from '../utils/accessControl.js'

export const getDashboard = async (req, res, next) => {
  try {
    const { user } = req
    const isManager = hasRoleAtLeast(user, 'manager')

    const projectFilter = { isDeleted: false, ...(isManager ? {} : { $or: [{ owner: user._id }, { members: user._id }] }) }
    const taskFilter = { isDeleted: false, ...(isManager ? {} : { $or: [{ assignedTo: user._id }, { createdBy: user._id }] }) }

    const [totalProjects, totalTasks, doneTasks, totalMembers, recentProjects, kanbanTasks, upcomingTasks] = await Promise.all([
      Project.countDocuments(projectFilter),
      Task.countDocuments(taskFilter),
      Task.countDocuments({ ...taskFilter, status: 'done' }),
      User.countDocuments({ approvalStatus: 'approved', isActive: true }),
      Project.find(projectFilter)
        .select('title status progress coverColor members updatedAt')
        .populate('members', 'name username avatarStyle')
        .sort({ updatedAt: -1 })
        .limit(5)
        .lean(),
      Task.find({ ...taskFilter })
        .select('title status priority dueDate assignedTo project updatedAt')
        .populate('assignedTo', 'name username avatarStyle')
        .populate('project', 'title')
        .sort({ updatedAt: -1 })
        .limit(20)
        .lean(),
      Task.find({ ...taskFilter, status: { $ne: 'done' }, dueDate: { $exists: true, $ne: null } })
        .select('title status dueDate assignedTo project')
        .populate('project', 'title')
        .populate('assignedTo', 'name username avatarStyle')
        .sort({ dueDate: 1 })
        .limit(8)
        .lean(),
    ])

    const recentProjectIds = recentProjects.map(project => project._id)
    const projectTaskStats = recentProjectIds.length
      ? await Task.aggregate([
        { $match: { project: { $in: recentProjectIds }, isDeleted: false } },
        {
          $group: {
            _id: '$project',
            total: { $sum: 1 },
            done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
          },
        },
      ])
      : []
    const statsByProject = new Map(projectTaskStats.map(stat => [stat._id.toString(), stat]))
    const recentProjectsWithProgress = recentProjects.map(project => {
      const taskStats = statsByProject.get(project._id.toString())
      const taskProgress = taskStats?.total ? Math.round((taskStats.done / taskStats.total) * 100) : null
      return {
        ...project,
        progress: project.status === 'completed' ? 100 : taskProgress ?? project.progress ?? 0,
      }
    })

    let employeeStats = null
    if (can(user, 'viewEmployeeSummary')) {
      const [employees, openTaskCounts] = await Promise.all([
        User.find({ approvalStatus: 'approved', isActive: true })
          .select('name designation team avatarStyle')
          .lean(),
        Task.aggregate([
          { $match: { isDeleted: false, status: { $ne: 'done' } } },
          { $unwind: '$assignedTo' },
          { $group: { _id: '$assignedTo', openTasks: { $sum: 1 } } },
        ]),
      ])
      const countsByUser = new Map(openTaskCounts.map(row => [row._id.toString(), row.openTasks]))
      const stats = employees.map(emp => {
        const openTasks = countsByUser.get(emp._id.toString()) || 0
        const load = openTasks > 5 ? 'overloaded' : openTasks > 2 ? 'busy' : 'available'
        return { ...emp, openTasks, load }
      })
      const available = stats.filter(e => e.openTasks <= 2).length
      const busy = stats.filter(e => e.openTasks > 2 && e.openTasks <= 5).length
      const overloaded = stats.filter(e => e.openTasks > 5).length
      employeeStats = {
        available,
        busy,
        overloaded,
        total: employees.length,
        employees: stats
          .sort((a, b) => b.openTasks - a.openTasks)
          .slice(0, 6),
      }
    }

    res.json({
      success: true,
      stats: { totalProjects, totalTasks, doneTasks, totalMembers },
      recentProjects: recentProjectsWithProgress,
      kanbanTasks,
      upcomingTasks,
      employeeStats,
    })
  } catch (error) {
    next(error)
  }
}

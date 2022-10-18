<template>

  <div class="app-container">
    <!-- 查询和其他操作 -->
    <div class="filter-container" style="margin: 10px 0 10px 0;">
      <el-row :gutter="10">
        <el-col :span="4">
          <div class="grid-content bg-purple">
            <el-input
              v-model="query.appName"
              clearable
              class="filter-item"
              style="width: 200px;"
              size="small"
              placeholder="请输入应用名称"
              @keyup.enter.native="handleFind"
            />
          </div>
        </el-col>
        <el-col :span="8">
          <div class="block">
            <el-date-picker
              v-model="time"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
            />
          </div>
        </el-col>
        <el-col :span="9">
          <div class="grid-content bg-purple">
            <el-button class="filter-item" size="small" type="primary" icon="el-icon-search" @click="handleFind">搜索
            </el-button>
            <el-button class="filter-item" size="small" type="primary" icon="el-icon-refresh" @click="handleReset">重置
            </el-button>
            <el-button class="filter-item" size="small" type="primary" icon="el-icon-plus" @click="handleAdd">添加
            </el-button>
            <el-button type="primary" :disabled="this.sels.length === 0" @click="batchDelect">批量删除</el-button>
          </div>
        </el-col>
      </el-row>
    </div>
    <el-table v-loading="loading" :data="tableData" border style="width: 100%" @selection-change="handleSelectionChange">
      <el-table-column type="selection" />
      <el-table-column label="序号" width="60" align="center">
        <template slot-scope="scope">
          <span>{{ scope.$index + 1 }}</span>
        </template>
      </el-table-column>

      <el-table-column label="应用名称" width="200" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.appName }}</span>
        </template>
      </el-table-column>

      <el-table-column label="应用标识" width="200" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.appCode }}</span>
        </template>
      </el-table-column>

      <el-table-column label="应用介绍" width="200" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.appDesc }}</span>
        </template>
      </el-table-column>

      <el-table-column label="创建时间" width="160" align="center" prop="createTime">
        <template slot-scope="scope">
          <span>{{ scope.row.createTime }}</span>
        </template>
      </el-table-column>

      <el-table-column label="操作" fixed="right" min-width="150" align="center">
        <template slot-scope="scope">
          <el-button type="text" icon="el-icon-edit" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button type="text" icon="el-icon-delete" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!--分页-->
    <div class="pagination">
      <el-pagination
        :current-page.sync="currentPage"
        :page-size="pageSize"
        layout="total, prev, pager, next, jumper"
        :total="total"
        background
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 添加或修改对话框 -->
    <el-dialog :title="title" :visible.sync="dialogFormVisible">
      <el-form ref="form" :model="form" :rules="dataRule">

        <el-form-item label="应用名称" :label-width="formLabelWidth" prop="appName">
          <el-input v-model="form.appName" auto-complete="off" placeholder="请输入应用名称" />
        </el-form-item>

        <el-form-item label="应用标识" :label-width="formLabelWidth" prop="appCode">
          <el-input v-model="form.appCode" auto-complete="off" placeholder="请输入应用标识" />
        </el-form-item>

        <el-form-item label="应用介绍" :label-width="formLabelWidth" prop="appDesc">
          <el-input v-model="form.appDesc" auto-complete="off" placeholder="请输入应用介绍" />
        </el-form-item>

      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="dialogFormVisible = false">取 消</el-button>
        <el-button size="small" type="primary" @click="submitForm">确 定</el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script>
import { getAppList, addApp, updateApp, deleteApp, deleteVehiclds } from '@/api/app'
import { parseTime } from '@/utils/index'
import '@riophae/vue-treeselect/dist/vue-treeselect.css'

export default {

  data() {
    return {
      tableData: [],
      sels: [],
      keyword: '',
      title: '',
      currentPage: 1,
      pageSize: 10,
      total: 0, // 总数量
      dialogFormVisible: false, // 控制弹出框
      formLabelWidth: '120px',
      isEditForm: false,
      dateScopes: [{
        id: 1,
        des: '全部'
      },
      {
        id: 2,
        des: '本级'
      },
      {
        id: 3,
        des: '本级以及子级'
      },
      {
        id: 4,
        des: '自定义'
      }
      ],
      deptTreeProps: {
        label: 'name',
        children: 'children'
      },
      query: {
        appName: ''
      },
      form: {
        appId: 0,
        appName: '',
        appCode: '',
        appDesc: '',
        dsType: 0,
        deptName: ''
      },
      // 分类菜单列表
      menuData: [],
      // tree配置项
      defaultProps: {
        children: 'children',
        label: 'name'
      },
      selectapp: {},
      checkAll: false,
      menuIds: [],
      // 表单校验
      dataRule: {
        appName: [{ required: true, message: '应用名称不能为空', trigger: 'blur' }],
        appDesc: [{ required: true, message: '应用介绍不能为空', trigger: 'blur' }],
        appCode: [{ required: true, message: '应用标识不能为空', trigger: 'blur' }]
      },
      loading: false,
      time: []
    }
  },
  created() {
    this.appList()
  },
  methods: {
    parseTime,
    // 获取应用
    appList: function() {
      this.loading = true
      const params = new URLSearchParams()
      params.append('current', this.currentPage)
      params.append('size', this.pageSize)
      params.append('appName', this.query.appName)
      params.append('time', this.time)
      getAppList(params).then(response => {
        this.tableData = response.data.data.records
        this.total = response.data.data.total
        this.loading = false
      })
    },
    handleSelectionChange(sels) {
      this.sels = sels
      console.log(sels)
    },
    batchDelect() {
      // 删除前的提示
      this.$confirm('确认删除记录吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const ids = this.sels.map((item) => item.id)
        ids.join(',')
        deleteVehiclds({ ids: ids }).then((res) => {
          if (res.code === '10000') {
            this.$message({
              message: '删除成功',
              type: 'success'
            })
          }
        })
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '已取消删除'
        })
      })
    },
    handleFind: function() {
      this.appList()
    },
    handleReset: function() {
      this.query = {
        appName: ''
      }
      this.appList()
    },
    // 添加应用
    handleAdd: function() {
      this.dialogFormVisible = true
      this.title = '增加应用'
      this.form = {
        appId: 0,
        appName: '',
        appCode: '',
        appDesc: '',
        // 数据权限类型
        dsType: ''
      }
      this.isEditForm = false
    },

    // 编辑应用
    handleEdit: function(row) {
      this.dialogFormVisible = true
      this.isEditForm = true
      this.title = '编辑应用'
      this.form = row
    },

    handleDelete: function(row) {
      const that = this
      this.$confirm('此操作将把应用删除, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          deleteApp(row.appId).then(response => {
            if (response.data.code === 200) {
              this.$message({
                type: 'success',
                message: '操作成功'
              })
              that.appList()
            } else {
              this.$message({
                type: 'error',
                message: response.data.msg
              })
            }
          })
        })
        .catch(() => {
          this.$message({
            type: 'info',
            message: '已取消删除'
          })
        })
    },
    submitForm: function() {
      this.$refs['form'].validate((valid) => {
        if (valid) {
          if (this.isEditForm) {
            updateApp(this.form).then(response => {
              if (response.data.code === 200) {
                this.$message({
                  type: 'success',
                  message: '操作成功'
                })
                this.dialogFormVisible = false
                this.roleList()
              } else {
                this.$message({
                  type: 'error',
                  message: response.data
                })
              }
            })
          } else {
            addApp(this.form).then(response => {
              if (response.data.code === 200) {
                this.$message({
                  type: 'success',
                  message: '操作成功'
                })
                this.dialogFormVisible = false
                this.roleList()
              } else {
                this.$message({
                  type: 'error',
                  message: response.data.msg
                })
              }
            })
          }
        }
      })
    }
  }
}
</script>

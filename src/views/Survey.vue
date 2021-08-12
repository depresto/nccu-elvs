<template>
  <DefaultLayout backgroundColor="#f0f2f5">
    <div class="survey">
      <div class="container">
        <div class="form">
          <el-form
            label-position="top"
            ref="surveyForm"
            label-width="100px"
            :model="form"
            :rules="rules"
            hide-required-asterisk
          >
            <div class="text-center">
              <h2>受試者參與研究同意書</h2>
            </div>

            <div class="caption">
              <p>親愛的同學，您好：</p>
              <p>
                誠摯地邀請您參與「發展『具遊戲激勵機制之英文聽力系統』 」的研究。本研究將邀請您使用英語影片聽力學習，
                並與其他受試者一同參與排行榜分數排名，線上討論採小組方式進行，將會由研究者將同學進行隨機分組。
              </p>
              <p>
                本研究資料收集的內容包含：問卷、前後測驗 、
                線上系統的個人操作行為及訪談資料。訪談將由研究者採隨機方式抽取數名同學進行。
              </p>
              <p>
                所有的問卷、前後測驗、操作行為及訪談等資料，將僅供本研究學術研究使用，不另做其他用途，您的所有資料將會被匿名保密，請您放心地填答與參與實驗。
              </p>

              <br />
              <p>
                國立政治大學圖書資訊與檔案學研究所
                <br />
                研究生：林宛儀
                <br />
                指導教授：陳志銘 博士
                <br />
              </p>
              <p>若您同意參與本研究，請於下方勾選同意參與本研究並簽名與填寫日期，謝謝您！</p>
            </div>

            <div class="form-group">
              <el-form-item prop="name" label="基本資料" required>
                <el-input placeholder="姓名" v-model="form.name" style="width: 200px"></el-input>
              </el-form-item>
            </div>
            <div class="form-group">
              <el-form-item prop="confirmed" label="本人已詳細閱讀本同意書" required>
                <el-radio-group v-model="form.confirmed">
                  <el-radio label="同意參與研究" border class="mb-1">同意參與研究</el-radio>
                </el-radio-group>
              </el-form-item>
            </div>
            <div class="form-group">
              <el-form-item prop="confirmDate" label="填寫日期" required>
                <el-date-picker v-model="form.confirmDate" type="date" placeholder="請選擇填寫日期"> </el-date-picker>
              </el-form-item>
            </div>

            <div class="text-center mt-5">
              <el-button type="primary" class="px-5" @click="onSubmit">提交</el-button>
              <el-alert
                title="題目尚未填答完畢，請往上檢查看看"
                type="warning"
                center
                show-icon
                v-if="!formValid"
                class="mt-3"
              >
              </el-alert>
            </div>
          </el-form>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script>
import DefaultLayout from '@/components/layouts/DefaultLayout'
import { db } from '../helpers/db'
export default {
  components: {
    DefaultLayout,
  },
  data() {
    return {
      formValid: true,
      form: {
        name: null,
        confirmed: null,
        confirmDate: null,
      },
      rules: {
        name: [{ required: true, message: '請填寫姓名', trigger: 'blur' }],
        confirmed: [{ required: true, message: '請填寫此欄位', trigger: 'blur' }],
        confirmDate: [{ required: true, message: '請選擇填寫日期', trigger: 'blur' }],
      },
    }
  },
  methods: {
    onSubmit() {
      const {
        user: { id: userId },
      } = this.$store.state

      this.$refs['surveyForm'].validate(valid => {
        this.formValid = valid
        if (valid) {
          const userDoc = db.collection('users').doc(userId)
          userDoc.update({ survey: this.form })
          this.$message({
            showClose: true,
            message: '感謝填答！',
            type: 'success',
          })
          this.$router.push('/scale')
        } else {
          return false
        }
      })
    },
  },
}
</script>

<style lang="scss" scoped>
.survey {
  .form {
    padding: 0 100px;
    padding-top: 50px;
    padding-bottom: 100px;
    background-color: #fff;
    border-radius: 10px;
    .caption {
      padding: 25px 20px;
      line-height: 1.5;
      border: solid 1px rgba(0, 0, 0, 0.16);
      box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.16);
      background-color: #f0f2f5;
    }
  }
}
.form-group {
  margin-top: 50px;
  label {
    strong {
      color: #f2784b;
    }
  }
}
</style>

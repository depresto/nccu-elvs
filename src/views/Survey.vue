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
              <h2>英語聽力使用情形</h2>
            </div>

            <div class="caption">
              各位同學您好：<br />
              感謝您抽空參與本次研究。這是一份有關大學生英語聽力使用之問卷調查，目的是希望了解您目前使用英語聽力的情形。希望您能提供寶貴的經驗，您的回答對於本研究有很大的幫助。本問卷所有資料僅作研究分析之用，絕不對外公開，請同學務必按照真實情況作答。感謝您的配合與協助！
            </div>

            <div class="form-group">
              <el-form-item label="基本資料" required>
                <div class="row">
                  <el-form-item prop="name" class="col-md-3 mr-2">
                    <el-input placeholder="姓名" v-model="form.name"></el-input>
                  </el-form-item>
                  <el-form-item prop="department" class="col-md-3 mr-2">
                    <el-input placeholder="科系" v-model="form.department"></el-input>
                  </el-form-item>
                  <el-form-item prop="gender" class="col-md-2 mr-2">
                    <el-select v-model="form.gender" placeholder="生理性別">
                      <el-option label="男" value="男"></el-option>
                      <el-option label="女" value="女"></el-option>
                    </el-select>
                  </el-form-item>
                  <el-form-item prop="age" class="col-md-2 mr-2">
                    <el-input placeholder="年齡" v-model="form.age"></el-input>
                  </el-form-item>
                </div>
              </el-form-item>
            </div>
            <div class="form-group">
              <el-form-item label="1. 你擁有多久的英文學習經驗？" prop="learningYears">
                <el-select v-model="form.learningYears" placeholder="時間">
                  <el-option label="一年內" value="一年內"></el-option>
                  <el-option label="一年 ～ 三年" value="一年~三年"></el-option>
                  <el-option label="三年 ～ 五年" value="三年~五年"></el-option>
                  <el-option label="五年以上" value="五年以上"></el-option>
                </el-select>
              </el-form-item>
            </div>
            <div class="form-group">
              <el-form-item label="2. 是否曾經到過英語系國家？停留多久？" required>
                <el-form-item prop="hasBeenTo" class="d-inline-block mr-5">
                  <el-radio v-model="form.hasBeenTo" label="是" border class="mr-1">是</el-radio>
                  <el-radio v-model="form.hasBeenTo" label="否" border>否</el-radio>
                </el-form-item>

                <el-form-item prop="country" class="d-inline-block mr-5">
                  <el-select v-model="form.country" placeholder="國家名">
                    <el-option v-for="country in englishCountries" :key="country" :label="country" :value="country">
                    </el-option>
                  </el-select>
                </el-form-item>

                <el-form-item prop="time" class="d-inline-block mr-5">
                  <el-select v-model="form.time" placeholder="時間">
                    <el-option label="一年內" value="一年內"></el-option>
                    <el-option label="一年 ～ 三年" value="一年~三年"></el-option>
                    <el-option label="三年以上" value="三年以上"></el-option>
                  </el-select>
                </el-form-item>
              </el-form-item>
            </div>
            <div class="form-group">
              <el-form-item label="3. (承上題)主要是去做什麼？可複選。" prop="purposes">
                <div class="row">
                  <div class="col-md-6">
                    <el-checkbox-group v-model="form.purposes" class="row">
                      <el-checkbox label="旅遊" border class="mb-1 col-11 mx-3">旅遊</el-checkbox>
                      <el-checkbox label="求學（留學、交換學生）" border class="mb-1 col-11 mx-3">
                        求學（留學、交換學生）
                      </el-checkbox>
                      <el-checkbox label="工作（實習、正兼職）" border class="mb-1 col-11 mx-3">
                        工作（實習、正兼職）
                      </el-checkbox>
                      <el-checkbox label="其他" border class="mb-1 col-11 mx-3">其他</el-checkbox>
                    </el-checkbox-group>
                  </div>
                </div>
              </el-form-item>
            </div>
            <div class="form-group">
              <el-form-item label="4. 除了學校課堂外，是否會運用課餘時間做英語聽力練習？" prop="isUseTime">
                <el-radio v-model="form.isUseTime" label="是" border class="mr-1">是</el-radio>
                <el-radio v-model="form.isUseTime" label="否" border>否</el-radio>
              </el-form-item>
            </div>
            <div class="form-group">
              <el-form-item label="5. 除了學校課堂外，每週平均會花多少時間練習英語聽力？" prop="hours">
                <div class="row">
                  <div class="col-md-6">
                    <el-radio-group v-model="form.hours" class="row">
                      <el-radio label="完全不會想額外花時間" border class="mb-1 col-11 mx-3"
                        >完全不會想額外花時間</el-radio
                      >
                      <el-radio label="一小時以內" border class="mb-1 col-11 mx-3">一小時以內</el-radio>
                      <el-radio label="2-4小時" border class="mb-1 col-11 mx-3">2-4小時</el-radio>
                      <el-radio label="5-8小時" border class="mb-1 col-11 mx-3">5-8小時</el-radio>
                      <el-radio label="8小時以上" border class="mb-1 col-11 mx-3">8小時以上</el-radio>
                    </el-radio-group>
                  </div>
                </div>
              </el-form-item>
            </div>
            <div class="form-group">
              <el-form-item label="6. (承上題) 會用哪些方式練習？可複選。" prop="methods">
                <div class="row">
                  <div class="col-md-6">
                    <el-checkbox-group v-model="form.methods" class="row">
                      <el-checkbox label="電視劇、影集或電影" border class="mb-1 col-11 mx-3">
                        電視劇、影集或電影
                      </el-checkbox>
                      <el-checkbox label="廣播、Podcast、Clubhouse" border class="mb-1 col-11 mx-3">
                        廣播、Podcast、Clubhouse </el-checkbox
                      ><br />
                      <el-checkbox label="線上課程" border class="mb-1 col-11 mx-3">線上課程</el-checkbox>
                      <el-checkbox label="實體課程、家教、補習班" border class="mb-1 col-11 mx-3">
                        實體課程、家教、補習班
                      </el-checkbox>
                      <el-checkbox label="其他" border class="mb-1 col-11 mx-3">其他</el-checkbox>
                    </el-checkbox-group>
                  </div>
                </div>
              </el-form-item>
            </div>
            <div class="form-group">
              <el-form-item label="7. 您認為英語聽力在學習過程的重要性為何？" prop="importantace">
                <el-radio-group v-model="form.importantace">
                  <el-radio label="非常重要" border class="mb-1">非常重要</el-radio>
                  <el-radio label="很重要" border class="mb-1">很重要</el-radio>
                  <el-radio label="普通" border class="mb-1">普通</el-radio>
                  <el-radio label="不重要" border class="mb-1">不重要</el-radio>
                  <el-radio label="非常不重要" border class="mb-1">非常不重要</el-radio>
                </el-radio-group>
              </el-form-item>
            </div>
            <div class="form-group">
              <el-form-item label="8. 在學習過程最常遭遇怎樣的困難？可複選。" prop="difficulties">
                <div class="row">
                  <div class="col-md-6">
                    <el-checkbox-group v-model="form.difficulties" class="row">
                      <el-checkbox label="對字彙、詞組、慣用語片語的認知有限" border class="mb-1 col-11 mx-3">
                        對字彙、詞組、慣用語片語的認知有限
                      </el-checkbox>
                      <el-checkbox label="內容速過快" border class="mb-1 col-11 mx-3">內容速過快</el-checkbox>
                      <el-checkbox label="缺乏主題相關的背景知識" border class="mb-1 col-11 mx-3">
                        缺乏主題相關的背景知識
                      </el-checkbox>
                      <el-checkbox label="聽不懂說話者的口音" border class="mb-1 col-11 mx-3">
                        聽不懂說話者的口音
                      </el-checkbox>
                      <el-checkbox label="其他" border class="mb-1 col-11 mx-3">其他</el-checkbox>
                    </el-checkbox-group>
                  </div>
                </div>
              </el-form-item>
            </div>
            <div class="form-group">
              <el-form-item label="8. 在學習過程最常遭遇怎樣的困難？可複選。" prop="proficiencies">
                <div slot="label">9. 是否 <strong>參加且通過</strong> 國內外承認之英語相關檢定？可複選。</div>
                <div class="row">
                  <div class="col-md-6">
                    <el-checkbox-group v-model="form.proficiencies">
                      <div class="row">
                        <el-checkbox label="GEPT 初級" border class="col-md-5 mb-1 mx-3">GEPT 初級</el-checkbox>
                        <el-checkbox label="TOEFL" border class="col-md-5 mb-1 mx-3">TOEFL</el-checkbox>
                        <el-checkbox label="GEPT 中級" border class="col-md-5 mb-1 mx-3">GEPT 中級</el-checkbox>
                        <el-checkbox label="TOIEC" border class="col-md-5 mb-1 mx-3">TOIEC</el-checkbox>
                        <el-checkbox label="GEPT 中高級" border class="col-md-5 mb-1 mx-3">GEPT 中高級</el-checkbox>
                        <el-checkbox label="IETS" border class="col-md-5 mb-1 mx-3">IETS</el-checkbox>
                        <el-checkbox label="GEPT 高級" border class="col-md-5 mb-1 mx-3">GEPT 高級</el-checkbox>
                        <el-checkbox label="GRE" border class="col-md-5 mb-1 mx-3">GRE</el-checkbox>
                        <el-checkbox label="其他" border class="col-md-5 mb-1 mx-3">其他</el-checkbox>
                        <el-checkbox label="沒有參加過" border class="col-md-5 mb-1 mx-3">沒有參加過</el-checkbox>
                      </div>
                    </el-checkbox-group>
                  </div>
                </div>
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
        gender: null,
        department: null,
        age: null,
        learningYears: null,
        hasBeenTo: null,
        country: null,
        time: null,
        purposes: [],
        isUseTime: null,
        hours: null,
        methods: [],
        importantace: null,
        difficulties: [],
        proficiencies: [],
      },
      rules: {
        name: [{ required: true, message: '請填寫姓名', trigger: 'blur' }],
        gender: [{ required: true, message: '請填寫性別', trigger: 'change' }],
        department: [{ required: true, message: '請填寫科系', trigger: 'blur' }],
        age: [{ required: true, message: '請填寫年齡', trigger: 'blur' }],
        learningYears: [{ required: true, message: '請選擇時間', trigger: 'blur' }],
        hasBeenTo: [{ required: true, message: '請勾選', trigger: 'change' }],
        country: [{ required: true, message: '請選擇國家', trigger: 'change' }],
        time: [{ required: true, message: '請選擇時間', trigger: 'change' }],
        purposes: [{ required: true, message: '請選擇目的', trigger: 'change' }],
        isUseTime: [{ required: true, message: '請勾選', trigger: 'change' }],
        hours: [{ required: true, message: '請選擇', trigger: 'change' }],
        methods: [{ required: true, message: '請選擇', trigger: 'change' }],
        importantace: [{ required: true, message: '請選擇目的', trigger: 'change' }],
        difficulties: [{ required: true, message: '請選擇', trigger: 'change' }],
        proficiencies: [{ required: true, message: '請選擇', trigger: 'change' }],
      },
      englishCountries: ['美國', '英國', '加拿大', '澳大利亞', '愛爾蘭', '南非', '紐西蘭'],
    }
  },
  methods: {
    onSubmit() {
      const {
        user: { uid: userId },
      } = this.$store.state

      this.$refs['surveyForm'].validate(valid => {
        this.formValid = valid
        if (valid) {
          const userDoc = db.collection('users').doc(userId)
          userDoc.set({ survey: this.form }, { merge: true })
          this.$message({
            showClose: true,
            message: '感謝填答！',
            type: 'success',
          })
          this.$router.push('/')
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

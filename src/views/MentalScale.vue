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
              <h2>第二語言模糊容忍度量表</h2>
            </div>

            <div class="caption">
              <p>
                這份量表是為了要瞭解同學在學習英語時的想法，沒有標準答案，請依照您實際的想法或經驗填寫即可。
                本研究收集之資料僅提供學術研究使用，將不做其他用途；您的所有資料將被匿名保密，請您放心填答。
              </p>
            </div>

            <div class="form-group">
              <el-form-item prop="age" label="年齡" required>
                <el-input v-model="form.age" style="width: 200px"></el-input>
              </el-form-item>
            </div>
            <div class="form-group">
              <el-form-item label="1. 當我閱讀英語時，如果無法完全理解語意，我會感到不耐煩。" :rules="scaleRule">
                <el-radio-group v-model="form.scale1">
                  <el-radio label="1" border class="mb-1">非常不同意</el-radio>
                  <el-radio label="2" border class="mb-1">不同意</el-radio>
                  <el-radio label="3" border class="mb-1">同意</el-radio>
                  <el-radio label="4" border class="mb-1">非常同意</el-radio>
                </el-radio-group>
              </el-form-item>
            </div>
            <div class="form-group">
              <el-form-item label="2. 當我聽不懂老師所說的英語時，我會很困擾。" prop="scale2" :rules="scaleRule">
                <el-radio-group v-model="form.scale2">
                  <el-radio label="1" border class="mb-1">非常不同意</el-radio>
                  <el-radio label="2" border class="mb-1">不同意</el-radio>
                  <el-radio label="3" border class="mb-1">同意</el-radio>
                  <el-radio label="4" border class="mb-1">非常同意</el-radio>
                </el-radio-group>
              </el-form-item>
            </div>
            <div class="form-group">
              <el-form-item
                label="3. 當我寫英語作文時，我不喜歡我的想法無法被確切表達出來的感覺。"
                prop="scale3"
                :rules="scaleRule"
              >
                <el-radio-group v-model="form.scale3">
                  <el-radio label="1" border class="mb-1">非常不同意</el-radio>
                  <el-radio label="2" border class="mb-1">不同意</el-radio>
                  <el-radio label="3" border class="mb-1">同意</el-radio>
                  <el-radio label="4" border class="mb-1">非常同意</el-radio>
                </el-radio-group>
              </el-form-item>
            </div>
            <div class="form-group">
              <el-form-item label="4. 當我完全無法理解某些英文文法時，我會很困擾。" prop="scale4" :rules="scaleRule">
                <el-radio-group v-model="form.scale4">
                  <el-radio label="1" border class="mb-1">非常不同意</el-radio>
                  <el-radio label="2" border class="mb-1">不同意</el-radio>
                  <el-radio label="3" border class="mb-1">同意</el-radio>
                  <el-radio label="4" border class="mb-1">非常同意</el-radio>
                </el-radio-group>
              </el-form-item>
            </div>
            <div class="form-group">
              <el-form-item label="5. 我不喜歡自己英文發音不是很標準的那種感覺。" prop="scale5" :rules="scaleRule">
                <el-radio-group v-model="form.scale5">
                  <el-radio label="1" border class="mb-1">非常不同意</el-radio>
                  <el-radio label="2" border class="mb-1">不同意</el-radio>
                  <el-radio label="3" border class="mb-1">同意</el-radio>
                  <el-radio label="4" border class="mb-1">非常同意</el-radio>
                </el-radio-group>
              </el-form-item>
            </div>
            <div class="form-group">
              <el-form-item label="6. 我不喜歡閱讀那些需要花時間才能完全理解的英語。" prop="scale6" :rules="scaleRule">
                <el-radio-group v-model="form.scale6">
                  <el-radio label="1" border class="mb-1">非常不同意</el-radio>
                  <el-radio label="2" border class="mb-1">不同意</el-radio>
                  <el-radio label="3" border class="mb-1">同意</el-radio>
                  <el-radio label="4" border class="mb-1">非常同意</el-radio>
                </el-radio-group>
              </el-form-item>
            </div>
            <div class="form-group">
              <el-form-item
                label="7. 即使我學了英語文法，有些還是很難用於口說和寫作，讓我覺得很困擾。"
                prop="scale7"
                :rules="scaleRule"
              >
                <el-radio-group v-model="form.scale7">
                  <el-radio label="1" border class="mb-1">非常不同意</el-radio>
                  <el-radio label="2" border class="mb-1">不同意</el-radio>
                  <el-radio label="3" border class="mb-1">同意</el-radio>
                  <el-radio label="4" border class="mb-1">非常同意</el-radio>
                </el-radio-group>
              </el-form-item>
            </div>
            <div class="form-group">
              <el-form-item
                label="8. 我不喜歡當我用英文書寫時，無法清楚地表達我想要的。"
                prop="scale8"
                :rules="scaleRule"
              >
                <el-radio-group v-model="form.scale8">
                  <el-radio label="1" border class="mb-1">非常不同意</el-radio>
                  <el-radio label="2" border class="mb-1">不同意</el-radio>
                  <el-radio label="3" border class="mb-1">同意</el-radio>
                  <el-radio label="4" border class="mb-1">非常同意</el-radio>
                </el-radio-group>
              </el-form-item>
            </div>
            <div class="form-group">
              <el-form-item
                label="9. 當老師用了一個我不會的英語單字時，我會覺得很困擾。"
                prop="scale9"
                :rules="scaleRule"
              >
                <el-radio-group v-model="form.scale9">
                  <el-radio label="1" border class="mb-1">非常不同意</el-radio>
                  <el-radio label="2" border class="mb-1">不同意</el-radio>
                  <el-radio label="3" border class="mb-1">同意</el-radio>
                  <el-radio label="4" border class="mb-1">非常同意</el-radio>
                </el-radio-group>
              </el-form-item>
            </div>
            <div class="form-group">
              <el-form-item
                label="10. 當我講英文時，如果不能清楚地表達自己的想法，我會覺得很不自在。"
                prop="scale10"
                :rules="scaleRule"
              >
                <el-radio-group v-model="form.scale10">
                  <el-radio label="1" border class="mb-1">非常不同意</el-radio>
                  <el-radio label="2" border class="mb-1">不同意</el-radio>
                  <el-radio label="3" border class="mb-1">同意</el-radio>
                  <el-radio label="4" border class="mb-1">非常同意</el-radio>
                </el-radio-group>
              </el-form-item>
            </div>
            <div class="form-group">
              <el-form-item
                label="11. 我不喜歡有時候會找不到與中文意思相同的英語單字。"
                prop="scale11"
                :rules="scaleRule"
              >
                <el-radio-group v-model="form.scale11">
                  <el-radio label="1" border class="mb-1">非常不同意</el-radio>
                  <el-radio label="2" border class="mb-1">不同意</el-radio>
                  <el-radio label="3" border class="mb-1">同意</el-radio>
                  <el-radio label="4" border class="mb-1">非常同意</el-radio>
                </el-radio-group>
              </el-form-item>
            </div>
            <div class="form-group">
              <el-form-item
                label="12. 我不喜歡閱讀英語的其中一個原因，是我必須去猜測它是什麼意思。"
                prop="scale12"
                :rules="scaleRule"
              >
                <el-radio-group v-model="form.scale12">
                  <el-radio label="1" border class="mb-1">非常不同意</el-radio>
                  <el-radio label="2" border class="mb-1">不同意</el-radio>
                  <el-radio label="3" border class="mb-1">同意</el-radio>
                  <el-radio label="4" border class="mb-1">非常同意</el-radio>
                </el-radio-group>
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
        age: null,
        scale1: null,
        scale2: null,
        scale3: null,
        scale4: null,
        scale5: null,
        scale6: null,
        scale7: null,
        scale8: null,
        scale9: null,
        scale10: null,
        scale11: null,
        scale12: null,
      },
      rules: {
        age: [{ required: true, message: '請填寫年齡', trigger: 'blur' }],
      },
      scaleRule: [{ required: true, message: '請填寫此欄位', trigger: 'blur' }],
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
          userDoc.update({ scale: this.form })
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

<template>
  <DefaultLayout>
    <el-dialog
      :visible.sync="showTimeupDialog"
      :show-close="false"
      :close-on-press-escape="false"
      :close-on-click-modal="false"
      width="30%"
      center
    >
      <div class="d-flex flex-column align-items-center">
        <img src="@/assets/icon/material-timer.svg" style="width: 60px" class="mb-3" alt="" />
        <h1>測驗時間結束</h1>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="$router.push(`/rank/${$route.params.videoId}`)">進入排行榜</el-button>
      </span>
    </el-dialog>

    <div class="container" v-if="!loading">
      <div class="d-flex justify-content-center mb-4">
        <div id="timer" class="text-center">
          <div class="title">剩餘時間</div>
          <span class="counter">{{ formattedQuizRemainingTime.minute }} : {{ formattedQuizRemainingTime.second }}</span>
        </div>
      </div>

      <div class="quiz-selector justify-content-center mb-4 mt-2">
        <div
          :class="[
            'quiz-selector-box',
            'mx-1',
            { answered: answers[index - 1] },
            { current: index - 1 === currentQuizIndex },
          ]"
          :key="index"
          v-for="index in quizes.length"
          @click="toQuizIndex(index)"
        >
          {{ index }}
        </div>
      </div>

      <div
        :key="index"
        v-for="(quiz, index) in quizes"
        :class="['mb-3', 'quiz-box', { 'd-none': currentQuizIndex !== index }]"
      >
        <div class="text-center">
          <div>
            {{ index + 1 }}. {{ quiz.question }}
            <el-button
              type="primary"
              icon="el-icon-refresh-left"
              size="mini"
              class="ml-1"
              round
              :disabled="currentQuizReplayDisabled"
              :loading="loadingAudio"
              @click="playQuizVoice(index)"
            >
              重播
            </el-button>
          </div>

          <div v-if="quiz.pic" class="mt-3">
            <img :src="quiz.pic" class="quiz-image" />
          </div>

          <div :class="['answer-list', { selected: Boolean(answers[index]) }]">
            <div
              :key="choiceIndex"
              v-for="(choice, choiceIndex) in quiz.choice"
              :class="[
                'answer-box',
                'mx-auto',
                'mt-3',
                { selected: choiceIndex === (answers[index] && answers[index].choiceIndex) },
                { 'is-answer': Boolean(answers[index]) && quiz.answer == choiceIndex },
              ]"
              @click="selectChoice(index, choiceIndex)"
            >
              <div :class="['option', { 'option-only': !choice.text }]">
                {{ String.fromCharCode(65 + choiceIndex) }}
              </div>
              <div class="choice" v-if="choice.text">{{ choice.text }}</div>
            </div>

            <div v-if="Boolean(answers[index])" class="mt-4">{{ quiz.detail }}</div>
          </div>

          <div class="mt-4">
            <el-button
              class="submit-button el-icon-arrow-left"
              circle
              v-if="currentQuizIndex > 0"
              @click="toPreviousQuiz"
            ></el-button>
            <el-button
              class="submit-button"
              round
              :disabled="!answers[index]"
              @click="toNextQuiz"
              v-if="currentQuizIndex < quizes.length - 1"
            >
              下一題 <i class="el-icon-arrow-right"></i>
            </el-button>
            <el-button
              class="submit-button"
              round
              :disabled="!answers[index]"
              @click="submitQuiz"
              v-if="currentQuizIndex == quizes.length - 1"
            >
              結束測驗 <i class="el-icon-s-promotion"></i>
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script>
let loadingInstance = null

import { Loading } from 'element-ui'
import { mapState } from 'vuex'
import DefaultLayout from '@/components/layouts/DefaultLayout'
import { db } from '../helpers/db'
export default {
  components: {
    DefaultLayout,
  },
  data() {
    return {
      currentQuizIndex: -1,
      quizes: [],
      answers: [],
      quizReplayCount: [],
      currentQuizReplayDisabled: false,
      currentAudio: null,
      loadingAudio: false,
      showTimeupDialog: false,
      loading: false,
    }
  },
  computed: {
    ...mapState({
      userId: state => state.userId,
      quizRemainingTime: state => state.round.quizRemainingTime,
    }),
    formattedQuizRemainingTime() {
      const minute = parseInt(this.quizRemainingTime / 60)
      const second = parseInt(this.quizRemainingTime % 60)
      return {
        minute: minute.toString().padStart(2, 0),
        second: (second > 0 ? second : 0).toString().padStart(2, 0),
      }
    },
  },
  created() {
    loadingInstance = Loading.service({ fullscreen: true })

    if (this.userId) {
      const vm = this
      this.fetchRoundData().then(() => {
        vm.fetchQuizData()
      })
    }
  },
  destroyed() {
    if (this.currentAudio) {
      this.currentAudio.pause()
    }
    this.$store.dispatch('round/clearQuizCountDownInterval')
  },
  watch: {
    userId: function (userId) {
      if (userId) {
        const vm = this
        this.fetchRoundData().then(() => {
          vm.fetchQuizData()
        })
      }
    },
    currentQuizIndex: function (index) {
      const vm = this
      if (index === 0) {
        setTimeout(() => {
          vm.playQuizVoice(index)
        }, 3000)
      } else {
        vm.playQuizVoice(index)
      }
    },
    quizRemainingTime: function (quizRemainingTime) {
      if (quizRemainingTime < 0) {
        this.$store.dispatch('round/submitQuizAnswers', this.answers)
        this.showTimeupDialog = true
      }
    },
  },
  methods: {
    async fetchRoundData() {
      this.loading = true
      const videoId = this.$route.params.videoId
      await this.$store.dispatch('round/fetchLatestRound', { videoId })

      this.loading = false
      loadingInstance.close()

      if (this.$store.state.round.finishedQuizAt) {
        this.$router.push(`/rank/${videoId}`)
      } else {
        this.$store.dispatch('round/startQuizCountDown')
      }
    },
    async fetchQuizData() {
      const videoId = this.$route.params.videoId
      const roundIndex = this.$store.state.round.roundIndex
      console.log('RoundIndex', roundIndex)

      const quizTagCount = {
        part1: 5,
        part2: 3,
      }
      const quizSkipCounter = {}
      Object.keys(quizTagCount).map(key => {
        quizSkipCounter[key] = quizTagCount[key] * roundIndex
      })
      const quizCounter = {
        part1: 0,
        part2: 0,
      }
      db.collection('quiz')
        .where('videoId', '==', videoId)
        .get()
        .then(quizSnapshot => {
          loadingInstance?.close()
          const quizes = quizSnapshot.docs.map(quizDoc => ({
            id: quizDoc.id,
            ...quizDoc.data(),
          }))
          quizes.sort((a, b) => a.id.localeCompare(b.id))
          quizes.sort((a, b) => a.tag.localeCompare(b.tag))

          for (let quiz of quizes) {
            if (quizSkipCounter[quiz.tag] > 0) {
              quizSkipCounter[quiz.tag] -= 1
            } else if (quizTagCount[quiz.tag] > quizCounter[quiz.tag]) {
              quizCounter[quiz.tag] += 1
              this.quizes.push(quiz)
            }
          }
          this.currentQuizIndex = 0
        })
    },
    playQuizVoice: function (index) {
      const audioFileUrl = this.quizes[index].audio_file
      if (audioFileUrl && (this.quizReplayCount[index] || 0) < 2) {
        if (this.currentAudio) {
          this.currentAudio.pause()
        }
        this.loadingAudio = true
        const audio = new Audio(audioFileUrl)
        audio.play().then(() => {
          this.loadingAudio = false
        })
        this.currentAudio = audio
        if (!this.quizReplayCount[index]) {
          this.quizReplayCount[index] = 1
        } else {
          this.quizReplayCount[index] += 1
        }
        this.currentQuizReplayDisabled = this.quizReplayCount[index] >= 2
      }
    },
    selectChoice(quizIndex, choiceIndex) {
      const answers = [...this.answers]
      answers[quizIndex] = {
        quizId: this.quizes[quizIndex].id,
        choiceIndex,
        correctAnswerIndex: this.quizes[quizIndex].answer,
        isCorrect: this.quizes[quizIndex].answer === choiceIndex,
      }
      this.answers = answers
    },
    toQuizIndex(index) {
      this.currentQuizIndex = index - 1
      this.currentQuizReplayDisabled = this.quizReplayCount[this.currentQuizIndex] >= 2
      this.currentAudio?.pause()
    },
    toPreviousQuiz() {
      this.currentQuizIndex -= 1
      this.currentQuizReplayDisabled = this.quizReplayCount[this.currentQuizIndex] >= 2
      this.currentAudio?.pause()
    },
    toNextQuiz() {
      this.currentQuizIndex += 1
      this.currentQuizReplayDisabled = this.quizReplayCount[this.currentQuizIndex] >= 2
      this.currentAudio?.pause()
    },
    submitQuiz() {
      const vm = this
      this.currentAudio?.pause()
      loadingInstance = Loading.service({ fullscreen: true })
      this.$store.dispatch('round/submitQuizAnswers', this.answers).then(function () {
        loadingInstance?.close()
        vm.$router.push(`/rank/${vm.$route.params.videoId}`)
      })
    },
  },
}
</script>

<style lang="scss" scoped>
.quiz-selector {
  display: flex;
}
.quiz-selector-box {
  width: 32px;
  height: 32px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  border: 1px solid #f0f2f5;
  box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.16);
  border-radius: 10px;
  font-weight: 500;
  position: relative;
  cursor: pointer;
  &.answered {
    background-color: #a9c5f5;
    border: 1px solid #a9c5f5;
    color: white;
  }
  &:hover,
  &.current {
    background-color: #4b80db;
    border: 1px solid #4b80db;
    color: white;
  }
}
.quiz-box {
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 20px;
  padding: 40px 10px;
}
.quiz-image {
  max-width: 600px;
}
@media screen and (min-width: 992px) {
  .quiz-box {
    padding: 40px 60px;
  }
}
.answer-box {
  width: 400px;
  text-align: left;
  padding: 10px 0;
  border: 1px solid #f0f2f5;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.16);
  border-radius: 10px;
  font-weight: 500;
  position: relative;
  cursor: pointer;
  .option {
    width: 24px;
    height: 24px;
    border-radius: 3px;
    background-color: #f2784b;
    position: absolute;
    left: 15px;
    top: 50%;
    margin-top: -12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-weight: bold;
    &.option-only {
      position: relative;
      margin-top: 0;
      left: 50%;
      margin-left: -12px;
    }
  }
  .choice {
    padding-left: 50px;
    padding-right: 10px;
    min-height: 10px;
    line-height: 1.5;
  }
  &:hover,
  &.selected {
    background-color: #f2784b;
    border: 1px solid #f2784b;
    color: #fff;
    .option {
      background-color: #fff;
      color: #f2784b;
    }
  }
}
.answer-list {
  &.selected {
    .answer-box.selected {
      background-color: #f94151;
      border: 1px solid #f94151;
      color: #fff;
      .option {
        background-color: #fff;
        color: #f94151;
      }
    }
    .answer-box.is-answer {
      background-color: #44a65b;
      border: 1px solid #44a65b;
      color: #fff;
      .option {
        background-color: #fff;
        color: #44a65b;
      }
    }
  }
}
.submit-button {
  background-color: #d8e7fc;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.16);
  color: #000;
  border: 1px solid #dcdfe6;
  transition: background-color 0.5s, box-shadow 0.5s;
  &:hover {
    background-color: #c3dcff;
    box-shadow: 0 3px 6px 0 rgba(0, 0, 0, 0.16);
    border: 1px solid #dcdfe6;
  }
  &.is-disabled {
    background-color: #dee8f8;
    color: #c0c4cc;
    border: 1px solid #dcdfe6;
  }
}

#timer {
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: white;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 10px 15px;
  border-radius: 5px;
  .title {
    letter-spacing: 2px;
    margin-bottom: 5px;
  }
  .counter {
    color: #f2784b;
    font-weight: 700;
    font-size: 30px;
  }
}
</style>

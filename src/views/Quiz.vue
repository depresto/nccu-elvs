<template>
  <DefaultLayout>
    <div class="container">
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

          <div
            :key="choiceIndex"
            v-for="(choice, choiceIndex) in quiz.choices"
            :class="[
              'answer-box',
              'mx-auto',
              'mt-3',
              { selected: choiceIndex === (answers[index] && answers[index].choiceIndex) },
            ]"
            @click="selectChoice(index, choiceIndex)"
          >
            <div class="option">{{ String.fromCharCode(65 + choiceIndex) }}</div>
            <div class="choice">{{ choice.text }}</div>
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
const quizTagCount = {
  vocabulary: 2,
  'listen & select': 2,
  dialogue: 1,
}

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
    }
  },
  computed: {
    ...mapState({
      isAuthenticating: state => state.isAuthenticating,
    }),
  },
  created() {
    loadingInstance = Loading.service({ fullscreen: true })
    const videoId = this.$route.params.videoId
    this.$store.dispatch('video/fetchVideo', { videoId })
    this.fetchRoundData()

    const quizCounter = {
      vocabulary: 0,
      'listen & select': 0,
      dialogue: 0,
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
        quizes.sort(() => Math.random() - 0.5)

        for (let quiz of quizes) {
          if (quizTagCount[quiz.tag] > quizCounter[quiz.tag]) {
            quizCounter[quiz.tag] += 1
            this.quizes.push(quiz)
          }
        }
        this.currentQuizIndex = 0
      })
  },
  watch: {
    currentQuizIndex: function (index) {
      this.playQuizVoice(index)
    },
    isAuthenticating: function () {
      this.fetchRoundData()
    },
  },
  methods: {
    fetchRoundData() {
      if (!this.isAuthenticating) {
        const videoId = this.$route.params.videoId
        const vm = this
        this.$store.dispatch('round/fetchLatestRound').then(function () {
          if (vm.$store.state.round.finishedQuizAt) {
            vm.$router.push(`/rank/${videoId}`)
          }
        })
      }
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
@media screen and (min-width: 992px) {
  .quiz-box {
    padding: 40px 60px;
  }
}
.answer-box {
  width: 300px;
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
  }
  .choice {
    padding-left: 45px;
    padding-right: 10px;
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
</style>

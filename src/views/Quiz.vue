<template>
  <DefaultLayout>
    <div class="container">
      <div :key="index" v-for="(quiz, index) in quizes" class="mb-3">
        <div>{{ index + 1 }}. {{ quiz.question }}</div>

        <div :key="choiceIndex" v-for="(choice, choiceIndex) in quiz.choices">
          ({{ String.fromCharCode(65 + choiceIndex) }}) {{ choice.text }}
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
import DefaultLayout from '@/components/layouts/DefaultLayout'
import db from '../helpers/db'
export default {
  components: {
    DefaultLayout,
  },
  data() {
    return {
      quizes: [],
    }
  },
  created() {
    const quizCounter = {
      vocabulary: 0,
      'listen & select': 0,
      dialogue: 0,
    }
    const quizRef = db.collection('quiz')
    quizRef.get().then(quizSnapshot => {
      const quizes = quizSnapshot.docs.map(quizDoc => quizDoc.data())
      quizes.sort(() => Math.random() - 0.5)

      for (let quiz of quizes) {
        if (quizTagCount[quiz.tag] > quizCounter[quiz.tag]) {
          quizCounter[quiz.tag] += 1
          this.quizes.push(quiz)
        }
      }
      console.log(this.quizes.choices)
    })
  },
}
</script>

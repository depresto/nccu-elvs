<template>
  <div>
    <el-table :data="vocabularies" style="width: 100%" max-height="250" empty-text="暫無單字" size="small">
      <el-table-column fixed prop="vocabulary" label="單字" width="120">
        <template slot-scope="scope">
          <span>{{ scope.row.vocabulary }}</span>
          <el-button
            class="ml-1"
            icon="el-icon-caret-right"
            circle
            size="mini"
            @click="onPronounce(scope.row.vocabulary)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="time" label="時間">
        <template slot-scope="scope">
          <span>{{ formatTime(scope.row.time) }}</span>
        </template>
      </el-table-column>
      <el-table-column fixed="right" label="操作">
        <template slot-scope="scope">
          <el-button-group>
            <el-button icon="el-icon-search" circle size="mini" @click="onLookup(tableData[scope.$index].time)" />
            <el-button
              icon="el-icon-delete"
              circle
              size="mini"
              @click.native.prevent="deleteRow(scope.$index, tableData)"
            />
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
export default {
  props: {
    onLookup: {
      type: Function,
    },
    vocabularies: {
      type: Array,
      default() {
        return []
      }
    }
  },
  methods: {
    deleteRow(index, rows) {
      rows.splice(index, 1)
    },
    formatTime(time) {
      const currentTime = Math.round(time)
      const minutes = Math.floor(currentTime / 60)
      const second = currentTime % 60
      const minute = Math.floor(minutes % 60)
      const hour = Math.floor(minutes / 60)

      if (hour > 0) {
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second
          .toString()
          .padStart(2, '0')}`
      } else {
        return `${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`
      }
    },
    onPronounce(vocabulary) {
      try {
        const audio = new Audio(`/upload/words/${vocabulary.toLowerCase()}.mp3`)
        audio.play()
        // eslint-disable-next-line no-empty
      } catch {}
    },
  },
}
</script>

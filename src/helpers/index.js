const firebaseAuthErrors = {
  'auth/user-not-found': '無此使用者',
  'auth/invalid-email': '信箱格式錯誤',
}

export const showFirebaseError = (vm, error) => {
  console.log(error)

  const errorMessage = firebaseAuthErrors[error.code] || error.message
  vm.$message({
    showClose: true,
    message: errorMessage,
    type: 'error',
  })
  return errorMessage
}

export const formatTime = time => {
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
}

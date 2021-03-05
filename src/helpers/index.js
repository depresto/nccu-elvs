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

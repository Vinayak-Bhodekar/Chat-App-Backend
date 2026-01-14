import multer from "multer"
import path from "path"


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, `${file.fieldname}-${uniqueSuffix}-${path.extname(file.originalname)}`)

  }
})


export const videoUpload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB limit
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
})
import { switchLanguage } from '../controllers/languageController.js';
import express from "express";

const router = express.Router();

router.get('/switch/:lang', switchLanguage);

export default router;


# QUICK START GUIDE - TOMORROW

## ⚡ 60 Second Launch

```bash
# 1. Start system (15 seconds)
cd /Users/toby_carlson/Desktop/sovrenai-workbench
docker-compose -f docker-compose.workbench.yml up -d

# 2. Verify health (5 seconds)
curl http://localhost:8888/health

# 3. Test classification (5 seconds)
curl -X POST http://localhost:8888/classify \
  -H "Content-Type: application/json" \
  -d '{"text":"2 + 2 = 4"}'

# 4. Open UI (5 seconds)
open http://localhost:3750/workbench/

# DONE! ✅
```

---

## 🎯 Essential URLs

| Service | URL |
|---------|-----|
| **Workbench** | http://localhost:3750/workbench/ |
| **Sovereign API** | http://localhost:8888/ |
| **Health** | http://localhost:8888/health |
| **Truth Floor** | http://localhost:8888/truth-floor |

---

## 🧪 Quick Tests

### Test 1: Math Truth (T1)
```bash
curl -X POST http://localhost:8888/classify \
  -H "Content-Type: application/json" \
  -d '{"text":"The speed of light is 299792458 m/s"}'
```
**Expected:** `"tier":1, "resistance":0.001`

### Test 2: Opinion (T10)
```bash
curl -X POST http://localhost:8888/classify \
  -H "Content-Type: application/json" \
  -d '{"text":"I think pizza is delicious"}'
```
**Expected:** `"tier":10, "resistance":0.35`

### Test 3: Speculation (T11)
```bash
curl -X POST http://localhost:8888/classify \
  -H "Content-Type: application/json" \
  -d '{"text":"Maybe aliens exist"}'
```
**Expected:** `"tier":11, "resistance":0.5`

### Test 4: Full Reasoning
```bash
curl -X POST http://localhost:8888/reason \
  -H "Content-Type: application/json" \
  -d '{"input":"What is truth?"}'
```
**Expected:** Complete 8-stage analysis

---

## 🔧 If Something Goes Wrong

### Quick Fix #1: Restart Everything
```bash
docker-compose -f docker-compose.workbench.yml restart
```

### Quick Fix #2: Check Status
```bash
docker ps | grep -E "(workbench|sovereign)"
```

### Quick Fix #3: View Logs
```bash
docker logs sovereign-engine --tail 50
docker logs sovrenai-workbench --tail 50
```

### Quick Fix #4: Clean Restart
```bash
docker-compose -f docker-compose.workbench.yml down
docker-compose -f docker-compose.workbench.yml up -d
```

---

## ✅ System Healthy When:

1. ✅ `curl http://localhost:8888/health` returns `"status":"ok"`
2. ✅ `curl http://localhost:3750/workbench/` returns HTML
3. ✅ Classification test returns valid tier
4. ✅ No critical errors in logs

---

## 📊 What to Monitor

### Success Metrics
- Response time < 500ms ✅
- Classification accuracy 100% ✅
- Truth Floor verified ✅
- No crashes or restarts ✅

### Watch For
- Slow responses (> 1 second)
- Classification errors
- Container crashes
- High CPU/memory usage

---

## 🚨 Emergency Stop

```bash
docker-compose -f docker-compose.workbench.yml down
```

---

## 📚 Full Documentation

- **Production Checklist:** `PRODUCTION-READY-CHECKLIST.md`
- **Integration Guide:** `SOVEREIGN-INTEGRATION.md`
- **Test Results:** `E2E-TEST-RESULTS.md`
- **Engine README:** `sovereign-engine/README.md`

---

## Current Status

**Containers:** ✅ Running
**Health:** ✅ Verified
**Performance:** ✅ Excellent (< 11ms)
**Tests:** ✅ 37/40 passed
**Ready:** ✅ YES

---

**You're all set for tomorrow! 🚀**

**Truth is cheap. Lies are expensive.** 🎯

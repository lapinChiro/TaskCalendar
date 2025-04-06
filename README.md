# JSON形式のタスクをカレンダーで表示するやつ

## 対応フォーマット

### サンプルJSON

```json
{
    "tasks": [
        {
            "date": "2025-04-18",
            "name": "山へ柴刈りに",
            "level": "黄",
            "assignee": "おじいさん"
        },
        {
            "date": "2025-04-19",
            "name": "川へ洗濯に",
            "level": "青",
            "assignee": "おばあさん"
        },
        {
            "date": "2025-04-20",
            "name": "鬼が島へ鬼退治に",
            "level": "赤",
            "assignee": "桃太郎"
        }
    ]
}
```

### JSONスキーマ

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ProjectTasks",
  "type": "object",
  "properties": {
    "tasks": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "date": {
            "type": "string",
            "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
          },
          "name": {
            "type": "string"
          },
          "level": {
            "type": "string",
            "enum": ["赤", "黄", "青"]
          },
          "assignee": {
            "type": "string"
          }
        },
        "required": ["date", "name", "level", "assignee"],
        "additionalProperties": false
      }
    }
  },
  "required": ["tasks"],
  "additionalProperties": false
}
```
